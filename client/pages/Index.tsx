import { useState, useRef, useEffect } from "react";
import { parsePDF, type ExtractionResponse } from "../lib/pdfParser";
import * as Dialog from "@radix-ui/react-dialog";

// Carrier logo mappings - add your logo URLs here
const CARRIER_LOGOS: Record<string, string> = {
  "allstate": "https://maticinsurance.sirv.com/carriers/regular/allstate.svg",
  "foremost": "https://maticinsurance.sirv.com/carriers/regular/foremost.svg",
  "safeco": "https://maticinsurance.sirv.com/carriers/regular/safeco.svg",
};

// Helper function to extract carrier brand name from full carrier name
function getCarrierBrandName(fullName: string): string {
  const normalized = fullName.toLowerCase().trim();
  
  // Check for known carrier brands
  for (const brand of Object.keys(CARRIER_LOGOS)) {
    if (normalized.includes(brand)) {
      return brand;
    }
  }
  
  return normalized;
}

export default function Index() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractionResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/heic",
    ];
    if (!allowedTypes.includes(file.type)) {
      setParseError("Please upload a PDF or image file (JPG, PNG, HEIC)");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setParseError("File size must be less than 50MB");
      return;
    }

    setUploadedFile(file);
    setIsLoading(true);
    setParseError(null);
    setExtractedData(null);

    try {
      const response = await parsePDF(file);
      console.log("Parse response:", response);
      
      if (response.status === "failed") {
        const errorMsg = response.error || "Failed to extract policy data";
        console.error("Extraction failed:", errorMsg);
        setParseError(errorMsg);
        setExtractedData(null);
      } else {
      setExtractedData(response);
        setParseError(null);
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
        // Close modal after successful extraction
        setModalOpen(false);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to upload and analyze PDF";
      console.error("Upload error:", error);
      setParseError(errorMsg);
      setExtractedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplaceDocument = () => {
    const input = document.getElementById("file-upload") as HTMLInputElement;
    input?.click();
  };

  const handleDeletePolicy = () => {
    setExtractedData(null);
    setUploadedFile(null);
    setLastUpdated(null);
    setParseError(null);
  };

  // Camera functions
  const startCamera = async () => {
    console.log("startCamera function called");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera API not supported");
        throw new Error("Camera API not supported in this browser");
      }
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      console.log("Camera access granted, setting up stream...");
      streamRef.current = stream;
      setIsCameraOpen(true);
      setCapturedImage(null);
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => {
            console.error("Error playing video:", err);
          });
        }
      }, 100);
    } catch (error) {
      console.error("Error accessing camera:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      let userMessage = "Unable to access camera.";
      if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
        userMessage = "Camera permission denied. Please allow camera access in your browser settings and try again.";
      } else if (errorMessage.includes("NotFoundError") || errorMessage.includes("no camera")) {
        userMessage = "No camera found. Please ensure your device has a camera connected.";
      } else if (errorMessage.includes("NotSupportedError") || errorMessage.includes("not supported")) {
        userMessage = "Camera access is not supported in this browser. Please use a modern browser or try uploading a file instead.";
      } else if (errorMessage.includes("NotReadableError")) {
        userMessage = "Camera is already in use by another application. Please close other apps using the camera and try again.";
      }
      
      setParseError(userMessage);
      setIsCameraOpen(false);
      
      // Show error in an alert for better visibility
      setTimeout(() => {
        alert(userMessage + "\n\nTip: Make sure you're using HTTPS or localhost, and check your browser's camera permissions.");
      }, 100);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageDataUrl);
        stopCamera();
      }
    }
  };

  const handleCapturedImage = async () => {
    if (!capturedImage) return;

    try {
      // Convert data URL to File
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });

      // Create a synthetic event for handleFileUpload
      const syntheticEvent = {
        target: {
          files: [file],
        },
      } as React.ChangeEvent<HTMLInputElement>;

      await handleFileUpload(syntheticEvent);
      setCapturedImage(null);
    } catch (error) {
      console.error("Error processing captured image:", error);
      setParseError("Error processing captured image");
    }
  };

  // Cleanup camera stream when component unmounts or modal closes
  useEffect(() => {
    if (!modalOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOpen(false);
      setCapturedImage(null);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [modalOpen]);

  // Normalize date to American format (MM/DD/YYYY) with leading zeros
  const normalizeDate = (dateValue: string | number | null | undefined): string => {
    if (!dateValue) return "Unknown";
    
    try {
      const dateStr = String(dateValue);
      
      // If already in MM/DD/YYYY format, normalize to have leading zeros
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
        const [month, day, year] = dateStr.split('/');
        return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
      }
      
      // If in YYYY-MM-DD format, convert to MM/DD/YYYY
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-');
        return `${month}/${day}/${year}`;
      }
      
      // Try parsing as Date object
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      }
      
      return dateStr; // Return original if can't parse
    } catch (error) {
      return String(dateValue);
    }
  };

  // Helper function to get numeric value from FieldValue
  const getNumericValue = (fieldValue: { value: string | number | null; confidence: number } | undefined): number | null => {
    if (!fieldValue || fieldValue.value === null || fieldValue.value === undefined) return null;
    if (typeof fieldValue.value === "number") return fieldValue.value;
    // Try to parse string values (remove $ and commas)
    const parsed = parseFloat(String(fieldValue.value).replace(/[$,]/g, ""));
    return isNaN(parsed) ? null : parsed;
  };

  // Calculate premium difference compared to current policy
  const calculatePremiumDifference = (): { amount: number; isCheaper: boolean } | null => {
    if (!extractedData || extractedData.status === "failed" || !extractedData.policy.premium?.value) {
      return null;
    }
    const proposedPremium = 1677.00;
    const currentPremium = getNumericValue(extractedData.policy.premium);
    if (currentPremium === null) return null;
    
    // Calculate difference: positive means proposed is more expensive, negative means cheaper
    const difference = proposedPremium - currentPremium;
    return {
      amount: Math.abs(difference),
      isCheaper: difference < 0, // Proposed is cheaper if difference is negative
    };
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}
      <div
        className="max-w-[900px] mx-auto px-3 md:px-20 py-3 md:py-10 pb-32 md:pb-40 flex-1 w-full overflow-x-hidden"
        style={{ minHeight: "1349px" }}
      >
        {/* Header */}
        <div className="flex justify-center items-center gap-3 mb-3">
          <svg
            width="96"
            height="32"
            viewBox="0 0 96 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_6993_23584)">
              <path
                d="M74.5466 20.5613L75.4715 21.2624C74.5466 22.6648 72.6939 23.9379 71.0779 24.3009C68.9967 24.7683 67.1417 24.5443 65.2941 23.5614C62.2906 21.9636 61.25 18.9252 61.8281 15.8868C62.4654 12.8184 64.603 10.9786 67.6092 10.2774C69.4592 9.80981 71.7582 10.0632 73.2623 11.1012C74.7778 12.1472 75.2403 13.0627 75.2403 14.4844C75.2403 15.3025 74.7778 16.1205 73.8528 16.3542C71.6733 16.9049 70.6154 15.1856 71.0947 13.4305C71.317 12.6168 70.841 12.0444 70.0956 11.7314C68.3029 10.9785 66.9155 12.8483 66.6842 14.4844C66.2217 17.7566 67.378 21.7299 71.0779 21.9636C72.6976 22.0659 73.8528 21.2624 74.5466 20.5613Z"
                fill="black"
              />
              <path
                d="M87.4692 16.5013C87.5073 16.4726 87.5507 16.4866 87.6045 16.5409L93.9588 22.9634C94.0719 23.0778 94.1228 23.2117 94.0097 23.3261L90.9189 26.4501C90.8057 26.5644 90.6223 26.5644 90.5092 26.4501L87.3861 23.2935C87.2895 23.1959 87.2752 23.0445 87.3439 22.9282C88.7459 20.5542 88.1185 18.0041 87.4464 16.6446C87.4131 16.5772 87.4311 16.5301 87.4692 16.5013Z"
                fill="#408DF6"
              />
              <path
                d="M86.6795 23.9188C86.7933 23.7933 86.9396 23.8336 87.0612 23.9566L90.0187 26.9458C90.1318 27.0601 90.1827 27.1941 90.0696 27.3084L87.0946 30.3153C86.9815 30.4296 86.7981 30.4296 86.6849 30.3153L82.9321 26.5222C82.8426 26.4318 82.829 26.3074 82.866 26.2038C82.9028 26.1005 82.9917 26.0121 83.114 25.9915C84.7018 25.7233 86.043 24.6213 86.6795 23.9188Z"
                fill="#66A4F7"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M82.7057 14.4899C85.396 14.4899 87.5769 16.6942 87.5769 19.4134C87.5769 22.1325 85.396 24.3368 82.7057 24.3368C80.0154 24.3368 77.8345 22.1325 77.8345 19.4134C77.8345 16.6942 80.0154 14.4899 82.7057 14.4899Z"
                fill="#EA4D72"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M91.1815 14.393C93.8718 14.393 96.0527 16.5973 96.0527 19.3164C96.0527 20.4927 95.6444 21.573 94.9633 22.4198C94.8337 22.581 94.5997 22.5828 94.4601 22.4417L88.0894 16.0027C87.9498 15.8616 87.9516 15.625 88.111 15.4941C88.9489 14.8057 90.0177 14.393 91.1815 14.393Z"
                fill="#1E74EB"
              />
              <path
                d="M0.0527344 6.53952V5.13717H6.99009C7.22133 5.13721 7.5682 5.25404 7.68382 5.60462C9.37964 9.29297 12.7712 16.5897 12.7712 16.5897L17.6148 5.58866C17.743 5.25404 18.0898 5.13717 18.3211 5.13717H25.2584V6.53952C23.871 6.77325 22.946 7.00697 22.946 8.64305C22.9429 12.7088 22.9445 16.731 22.946 20.7967C22.946 22.1991 24.144 22.6665 25.4897 23.143V24.3318H15.3149V23.134C16.7024 22.6665 17.6274 22.1991 17.6274 20.7967C17.6367 17.1872 17.6677 13.6549 17.6274 10.0454C17.6274 10.0454 13.136 20.5267 12.54 21.7316C12.1931 22.4328 11.8462 22.9003 11.3837 22.9003C10.8056 22.9003 10.4588 22.6665 9.99627 21.7316C8.22535 18.2244 4.44639 10.0454 4.44639 10.0454L4.44639 20.7967C4.44639 22.2049 5.60262 22.6665 6.99009 23.134V24.3026H0.0527348V23.134C1.4402 22.6665 2.36519 22.1991 2.36519 20.7997C2.36672 16.8165 2.36519 12.86 2.36519 8.87678C2.36519 7.2407 1.4402 7.00697 0.0527344 6.53952Z"
                fill="black"
              />
              <path
                d="M41.6763 22.4323C41.6763 23.6009 40.5295 24.5358 38.9014 24.5358C36.3577 24.5358 35.552 22.1389 35.552 22.1389C33.814 24.0684 31.8484 25.1201 28.8631 24.1943C26.5545 23.4784 26.0105 20.4335 27.7624 18.7438C29.5703 17.0029 31.725 16.6486 34.0453 16.3554C34.9702 16.2386 35.664 15.6543 35.664 14.9531C35.664 13.5309 35.664 11.4472 33.814 11.4472C31.5016 11.4472 32.889 13.7845 31.5016 15.1868C30.6369 16.0608 29.2972 16.0488 28.3782 15.4109C27.6731 14.9223 27.3572 14.0267 27.7778 13.091C28.7266 10.9798 31.5944 10.4042 33.5828 10.2786C39.1327 9.92812 40.2889 11.9146 40.2889 16.3555C40.2889 17.8793 40.2889 21.0299 40.2889 21.0299C40.2889 21.9481 40.5201 22.666 41.6763 22.4323ZM35.664 18.6927C35.664 17.2903 34.739 17.4072 32.978 17.9596C32.002 18.2657 31.5016 19.1601 31.3724 20.0928C31.1792 21.4876 31.9641 21.9648 33.0919 21.9755C34.5077 21.9889 35.664 20.5625 35.664 18.6927Z"
                fill="black"
              />
              <path
                d="M41.1471 10.9792C43.6907 10.278 44.8037 9.94165 45.5407 7.70697C45.7719 7.0058 46.2344 6.77207 46.9282 6.77207C47.6219 6.77207 47.8531 7.00579 47.8531 7.70702C47.8485 8.28428 47.8562 8.76583 47.8531 9.34309C47.8485 10.0371 48.3156 10.5117 49.2406 10.5117H52.2505L52.2468 11.9141C52.2468 11.9141 50.0845 11.9036 49.2406 11.9141C48.3139 11.9265 47.8624 12.3844 47.8531 13.3164C47.8531 15.6537 47.8531 17.7572 47.8531 20.3282C47.8531 22.198 49.2406 23.1328 51.2062 22.081L51.7843 22.8991C50.3968 24.0677 49.0094 24.5352 47.1594 24.5352C45.3095 24.5352 43.2283 22.8991 43.2283 20.3282V13.3164C43.2283 12.3815 42.3033 11.9141 41.1471 11.9141V10.9792Z"
                fill="black"
              />
              <path
                d="M61.4964 24.3014H53.1716L53.1716 23.1327C54.3278 22.899 55.026 22.4316 55.026 21.4923L55.0368 13.55C55.0368 12.615 54.5591 11.9139 53.1716 11.9139L51.7841 11.9138V10.5115C51.7841 10.5115 51.3173 10.5115 53.1694 10.5115C55.0216 10.5115 56.6403 10.161 57.7965 10.0441C58.9527 9.92716 59.6464 10.2779 59.6464 11.4465C59.6481 14.709 59.6464 21.4967 59.6464 21.4967C59.6464 22.4316 60.3402 22.899 61.4964 23.1327L61.4964 24.3014Z"
                fill="black"
              />
              <path
                d="M59.4153 6.42221C59.4153 7.90666 58.2246 9.11005 56.7559 9.11005C55.2872 9.11005 54.0966 7.90666 54.0966 6.42221C54.0966 4.93776 55.2872 3.73438 56.7559 3.73438C58.2246 3.73438 59.4153 4.93776 59.4153 6.42221Z"
                fill="black"
              />
            </g>
            <defs>
              <clipPath id="clip0_6993_23584">
                <rect width="96" height="32" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </div>

        {/* Review Banner */}
        <div className="rounded-lg bg-[#E5F1FF] p-3 md:p-10 flex flex-col md:flex-row justify-between items-end gap-6 mb-6 w-full overflow-hidden">
          <div className="flex-1 flex flex-col gap-6">
            <h1 className="text-[32px] md:text-[40px] font-bold leading-[1.3] text-black">
              Review your insurance offer
            </h1>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-transparent rounded-lg p-3">
              <div className="w-16 h-16 flex-shrink-0">
                <svg
                  width="64"
                  height="60"
                  viewBox="0 0 64 60"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <ellipse
                    cx="30.2679"
                    cy="30.6813"
                    rx="29.7777"
                    ry="29.32"
                    fill="#66A4F7"
                  />
                </svg>
              </div>
              <div className="flex flex-col gap-3 items-center md:items-start text-center md:text-left">
                <p className="text-base font-medium text-black leading-5">
                  I'm Maria, your [state] licensed insurance advisor. I've
                  helped 656 customers protect their most important belongings.
                </p>
                <div className="flex flex-wrap items-center md:items-start justify-center md:justify-start gap-6">
                  <div className="flex items-center gap-2">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M6.31623 6.94868C6.72457 6.81257 7 6.43043 7 6V3C7 1.34315 5.65685 0 4 0H1C0.447715 0 0 0.447715 0 1C0 8.85472 7.14528 16 15 16C15.5523 16 16 15.5523 16 15V12C16 10.3431 14.6569 9 13 9H10C9.56957 9 9.18743 9.27543 9.05132 9.68377L8.30429 11.9248C6.74458 10.9124 5.37501 9.58197 4.31438 8.05221L4.07516 7.69571L6.31623 6.94868ZM10.7208 11H13C13.5523 11 14 11.4477 14 12V13.9546C12.7978 13.8457 11.621 13.5439 10.503 13.0828L10.0866 12.9024L10.7208 11ZM2.04542 2H4C4.55228 2 5 2.44772 5 3V5.27924L3.09757 5.91338C2.53454 4.67278 2.16796 3.35246 2.04542 2Z"
                        fill="black"
                      />
                    </svg>
                    <span className="font-bold text-base leading-5 text-black">
                      653-762-8273
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M13 4C14.6569 4 16 5.34315 16 7V13C16 14.6569 14.6569 16 13 16H3C1.34315 16 0 14.6569 0 13V7C0 5.34315 1.34315 4 3 4H13ZM14 7.3L8.6585 11.7526C8.3129 12.055 7.81106 12.0802 7.43941 11.8282L7.3415 11.7526L2 7.301V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V7.3ZM12.432 6H3.567L8 9.67123L12.432 6Z"
                        fill="black"
                      />
                    </svg>
                    <span className="font-bold text-base leading-5 text-black">
                      maria.su@matic.com
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Offer Summary */}
        <div className="rounded-lg border border-[#E6E6E6] bg-white p-3 md:p-6 flex flex-col gap-5 mb-6">
          <h2 className="text-[32px] font-bold leading-[40px] text-black">
            Offer summary
          </h2>

          <div className="flex flex-col gap-5">
            {/* Premiums */}
            <div className="flex flex-col gap-1">
              <div className="flex items-start gap-2 justify-between">
                <div className="flex items-start gap-2">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.41992 9.09375V21.75H20.3306V9.09375"
                      stroke="black"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M1.88867 11.2634L12.3753 1.5L22.8619 11.2634"
                      stroke="black"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9.48242 21.7503V13.7949H15.2681V21.7503"
                      stroke="black"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-base font-medium leading-5 text-black">
                    Home insurance(annual)
                  </span>
                </div>
                <span className="text-base font-medium leading-5 text-black text-left md:text-right">
                  $1,677.00
                </span>
              </div>

              {extractedData && extractedData.status !== "failed" && !isLoading && (() => {
                const difference = calculatePremiumDifference();
                if (difference && difference.isCheaper) {
                  return (
              <div className="flex items-start justify-between">
                      <span className="text-base font-bold leading-5 text-[#10B981]">
                        Savings
                </span>
                      <span className="text-base font-bold leading-5 text-[#10B981] text-left md:text-right">
                        ${difference.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                </span>
              </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="flex items-start gap-2 justify-between">
              <div className="flex items-start gap-2">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M11.5884 2.54709C11.8038 2.45137 12.0446 2.43541 12.2685 2.49923L12.4004 2.54709L21.4007 6.54622C21.7546 6.70348 21.9818 7.04837 21.9941 7.42723L21.9885 7.5706L21.4161 12.7227C21.1249 15.3435 19.7003 17.6987 17.5285 19.174L17.241 19.3614L12.5244 22.3095C12.2407 22.4868 11.8902 22.509 11.5897 22.376L11.4644 22.3095L6.74777 19.3614C4.51178 17.9638 3.0061 15.6595 2.61709 13.063L2.57271 12.7227L2.00029 7.5706C1.95752 7.18564 2.14066 6.81546 2.46154 6.61369L2.58815 6.54622L11.5884 2.54709Z"
                    stroke="black"
                    strokeWidth="2"
                  />
                  <path
                    d="M11.2276 15.7616L7.65617 12.8734L7.99902 12.5007L11.2276 15.0163L16.2276 8.58783L16.5705 8.9605L11.2276 15.7616Z"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-base font-medium leading-5 text-black">
                  Umbrella(annual)
                </span>
              </div>
              <span className="text-base font-medium leading-5 text-black text-right">
                $1,234.00
              </span>
            </div>

            {/* Discounts */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="text-base font-bold leading-5 text-black">
                  Discounts
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 11.5L9.25 13L13 7"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="10"
                    cy="10"
                    r="7"
                    stroke="#10B981"
                    strokeWidth="2"
                  />
                </svg>
                <span className="text-base font-medium leading-5 text-black flex-1">
                  Paperless policy
                </span>
              </div>
            </div>

            <div className="h-px bg-[#D9D9D9]"></div>

            {/* Total */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <span className="text-2xl font-bold leading-8 text-black flex-1">
                  Total
                </span>
                <span className="text-2xl font-bold leading-8 text-black text-left md:text-right">
                  $3,317.00
                </span>
              </div>
              <p className="text-sm font-medium leading-5 text-[#333]">
                This total cost includes all your selected insurance products.
                Note that policy periods might be different.
              </p>
            </div>

            <div className="h-px bg-[#D9D9D9]"></div>
          </div>
        </div>

        {/* Home Insurance Details */}
        <div className="rounded-lg border border-[#E6E6E6] p-3 md:p-6 flex flex-col gap-5 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start px-3 md:px-1 gap-4">
            <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold leading-8 text-[#111827]">
              Home insurance details
            </h2>
            <p className="text-base font-medium leading-5 text-[#666]">
              12522 W Sunnyside Dr, El Mirage, AZ, 85335-6314
            </p>
          </div>
            <Dialog.Root 
              open={modalOpen} 
              onOpenChange={(open) => {
                // Allow closing the modal even during loading
                setModalOpen(open);
              }}
            >
              <Dialog.Trigger asChild>
                <button 
                  disabled={isLoading}
                  className="px-3 md:px-4 py-3 md:py-2 bg-[#156EEA] text-white text-sm font-bold rounded hover:bg-[#1257c7] transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full md:w-auto mx-auto md:mx-0"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    "Compare to your current policy"
                  )}
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-3 md:p-6 w-full max-w-md z-50 shadow-xl">
                  <Dialog.Title className="text-xl font-bold text-black mb-4">
                Compare with your current policy
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-[#666] mb-6">
                Upload your current policy's declaration page or take a picture and we'll extract
                    the data to show you a side-by-side comparison with the proposed policy.
                  </Dialog.Description>

                  {parseError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 font-medium">Error: {parseError}</p>
                    </div>
                  )}

                  {isLoading ? (
                    <div className="border-2 border-dashed border-[#D9D9D9] rounded-lg p-3 md:p-6 flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-[#156EEA] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm font-bold text-black">
                        Analyzing document...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Upload File Option */}
                      <label className={`border-2 border-dashed border-[#D9D9D9] rounded-lg p-3 md:p-6 flex flex-col items-center gap-3 cursor-pointer hover:bg-[#F9F9F9] transition-colors`}>
                        <input
                          id="file-upload-modal"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.heic"
                          disabled={isLoading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            
                            // Start upload (modal will close after processing)
                            const syntheticEvent = {
                              ...e,
                              target: e.target,
                            } as React.ChangeEvent<HTMLInputElement>;
                            await handleFileUpload(syntheticEvent);
                          }}
                          className="hidden"
                        />
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 2V14M2 12H22M7 7L12 2L17 7"
                            stroke="#666"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="text-center">
                          <p className="text-sm font-bold text-black">
                            Upload file
                          </p>
                          <p className="text-xs font-medium text-[#666] mt-1">
                            PDF or image (JPG, PNG, HEIC) • Max 50MB
                          </p>
                        </div>
                      </label>

                      {/* Divider */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-[#D9D9D9]"></div>
                        <span className="text-xs font-medium text-[#666]">OR</span>
                        <div className="flex-1 h-px bg-[#D9D9D9]"></div>
                      </div>

                      {/* Take Picture Option */}
                      {!isCameraOpen && !capturedImage ? (
                        <div className="border-2 border-dashed border-[#D9D9D9] rounded-lg p-3 md:p-6 flex flex-col items-center gap-3 cursor-pointer hover:bg-[#F9F9F9] transition-colors w-full bg-transparent"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("Take picture div clicked, starting camera...");
                            if (!isLoading) {
                              startCamera();
                            }
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            console.log("Mouse down on take picture button");
                          }}
                          style={{ 
                            pointerEvents: isLoading ? 'none' : 'auto',
                            cursor: isLoading ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 4H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z"
                              stroke="#666"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z"
                              stroke="#666"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="text-center">
                            <p className="text-sm font-bold text-black">
                              Take a picture
                            </p>
                            <p className="text-xs font-medium text-[#666] mt-1">
                              Use your device camera to capture the declaration page
                            </p>
                          </div>
                        </div>
                      ) : isCameraOpen ? (
                        <div className="border-2 border-dashed border-[#D9D9D9] rounded-lg p-3 md:p-4 flex flex-col items-center gap-4">
                          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex gap-3 w-full">
                            <button
                              onClick={stopCamera}
                              className="flex-1 px-3 md:px-4 py-3 md:py-2 text-sm font-medium text-[#666] border border-[#D9D9D9] rounded hover:bg-[#F9F9F9] transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={capturePhoto}
                              className="flex-1 px-3 md:px-4 py-3 md:py-2 bg-[#156EEA] text-white text-sm font-bold rounded hover:bg-[#1257c7] transition-colors"
                            >
                              Capture
                            </button>
                          </div>
                        </div>
                      ) : capturedImage ? (
                        <div className="border-2 border-dashed border-[#D9D9D9] rounded-lg p-3 md:p-4 flex flex-col items-center gap-4">
                          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                            <img
                              src={capturedImage}
                              alt="Captured document"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex gap-3 w-full">
                            <button
                              onClick={() => {
                                setCapturedImage(null);
                                startCamera();
                              }}
                              className="flex-1 px-3 md:px-4 py-3 md:py-2 text-sm font-medium text-[#666] border border-[#D9D9D9] rounded hover:bg-[#F9F9F9] transition-colors"
                            >
                              Retake
                            </button>
                            <button
                              onClick={handleCapturedImage}
                              disabled={isLoading}
                              className="flex-1 px-3 md:px-4 py-3 md:py-2 bg-[#156EEA] text-white text-sm font-bold rounded hover:bg-[#1257c7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Use This Photo
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="flex justify-end mt-6">
                    <Dialog.Close asChild>
                      <button 
                        disabled={isLoading}
                        className="px-3 md:px-4 py-3 md:py-2 text-sm font-medium text-[#666] hover:text-black disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </Dialog.Close>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            </div>

          <div className="flex flex-col gap-6">

            {/* Comparison Title */}
            {extractedData && extractedData.status !== "failed" && (
              <div className="px-3 md:px-4 py-3 md:py-2">
                <h2 className="text-2xl font-bold text-black">Compare coverages</h2>
              </div>
            )}

            {/* Carrier Comparison */}
            <div className={`${extractedData && extractedData.status !== "failed" ? "grid gap-2 md:gap-4" : "flex flex-row justify-between"} items-start px-3 md:px-4 py-3 md:py-2`} style={extractedData && extractedData.status !== "failed" ? { gridTemplateColumns: 'minmax(0, 1fr) minmax(80px, 1fr) minmax(80px, 1fr)', display: 'grid' } : {}}>
              <span className="text-base font-bold leading-5 text-black">
                Carrier
              </span>
              {extractedData && extractedData.status !== "failed" ? (
                <>
                  {/* Proposed Carrier */}
                  <div className="flex flex-col items-end text-right">
                    {(() => {
                      const carrierName = "foremost";
                      const logoUrl = CARRIER_LOGOS[carrierName];
                      
                      return (
                        <>
                          {logoUrl ? (
                            <img 
                              src={logoUrl} 
                              alt="FOREMOST"
                              className="max-h-[16px] md:max-h-[24px] object-contain mb-1 ml-auto"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.carrier-text-fallback')) {
                                  const span = document.createElement('span');
                                  span.className = 'carrier-text-fallback text-black font-bold text-sm md:text-base text-right whitespace-nowrap';
                                  span.textContent = 'FOREMOST';
                                  parent.insertBefore(span, parent.firstChild);
                                }
                              }}
                            />
                          ) : (
                            <span className="text-black font-bold text-sm md:text-base text-right whitespace-nowrap">FOREMOST</span>
                          )}
                          {extractedData.policy.carrier?.value && (
                            <span className="text-xs md:text-sm font-semibold text-black mt-1 text-right whitespace-nowrap">Proposed</span>
                          )}
                        </>
                      );
                    })()}
                </div>
                  {/* Current Carrier - with delete on hover */}
                  <div className="flex flex-col items-end text-right group relative min-w-0">
                    {extractedData.policy.carrier?.value ? (
                      (() => {
                        const fullCarrierName = String(extractedData.policy.carrier.value);
                        const carrierBrand = getCarrierBrandName(fullCarrierName);
                        const logoUrl = CARRIER_LOGOS[carrierBrand];
                        const displayName = fullCarrierName;
                        
                        return (
                          <>
                            {logoUrl ? (
                              <img 
                                src={logoUrl} 
                                alt={displayName}
                                className="max-h-[16px] md:max-h-[24px] object-contain mb-1 ml-auto flex-shrink-0"
                                title={displayName}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('.carrier-text-fallback')) {
                                    const span = document.createElement('span');
                                    span.className = 'carrier-text-fallback text-black font-bold text-sm md:text-base truncate block w-full text-right min-w-0';
                                    span.textContent = displayName || 'Unknown';
                                    span.title = displayName || 'Unknown';
                                    parent.insertBefore(span, parent.firstChild);
                                  }
                                }}
                              />
                            ) : (
                              <span 
                                className="text-black font-bold text-sm md:text-base truncate block w-full text-right min-w-0 overflow-hidden" 
                                title={displayName}
                              >
                                {displayName}
                              </span>
                            )}
                            <div className="flex items-center justify-end gap-2 mt-1 w-full">
                              <span className="text-xs md:text-sm font-semibold text-black text-right whitespace-nowrap">Current</span>
                              <button
                                onClick={handleDeletePolicy}
                                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                title="Remove current policy comparison"
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                                  className="text-[#666] hover:text-[#333]"
                                >
                    <path
                                    d="M12 4L4 12M4 4l8 8"
                                    stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                              </button>
                    </div>
                          </>
                        );
                      })()
                    ) : (
                      <>
                        <span 
                          className="text-black font-bold text-sm md:text-base truncate block w-full text-right whitespace-nowrap" 
                          title="Unknown"
                        >
                          Unknown
                        </span>
                        <div className="flex items-center justify-end gap-2 mt-1 w-full">
                          <span className="text-xs md:text-sm font-semibold text-black text-right whitespace-nowrap">Current</span>
                    <button
                            onClick={handleDeletePolicy}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            title="Remove current policy comparison"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                              className="text-[#666] hover:text-[#333]"
                  >
                    <path
                                d="M12 4L4 12M4 4l8 8"
                                stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                          </button>
                  </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-start">
                  {(() => {
                    const carrierName = "foremost";
                    const logoUrl = CARRIER_LOGOS[carrierName];
                    const displayName = "FOREMOST";
                    
                    return (
                      <>
                        {logoUrl ? (
                          <img 
                            src={logoUrl} 
                            alt={displayName}
                            className="max-h-[24px] object-contain mb-1"
                            title={displayName}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.carrier-text-fallback')) {
                                const span = document.createElement('span');
                                span.className = 'carrier-text-fallback text-black font-bold text-base truncate block w-full';
                                span.textContent = displayName;
                                span.title = displayName;
                                parent.insertBefore(span, parent.firstChild);
                              }
                            }}
                          />
                        ) : (
                          <span 
                            className="text-black font-bold text-base truncate block w-full" 
                            title={displayName}
                          >
                            {displayName}
                          </span>
                        )}
                        {extractedData && extractedData.policy.carrier?.value && (
                        <span className="text-sm font-semibold text-black mt-1">Proposed</span>
                        )}
                      </>
                    );
                  })()}
                      </div>
              )}
                        </div>

            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-start px-3 md:px-4">
                <span className="text-base font-bold leading-5 text-black">
                  Policy Basics
                </span>
                        </div>

              <div className="flex flex-col">
                <div className={`${extractedData && extractedData.status !== "failed" ? "grid gap-2 md:gap-4" : "flex flex-row justify-between"} items-start px-3 md:px-4 py-3 md:py-3`} style={extractedData && extractedData.status !== "failed" ? { gridTemplateColumns: 'minmax(0, 1fr) minmax(80px, 1fr) minmax(80px, 1fr)', display: 'grid' } : {}}>
                  <span className="text-base font-normal md:font-medium leading-5 text-black">
                    Policy Start Date
                        </span>
                  {extractedData && extractedData.status !== "failed" ? (
                    <>
                      <span className="text-base font-normal md:font-medium leading-5 text-black text-right">
                        01/01/2026
                      </span>
                      <span className="text-base font-normal md:font-medium leading-5 text-black text-right">
                        {extractedData.policy.effectiveDate?.value 
                          ? normalizeDate(extractedData.policy.effectiveDate.value)
                          : "Unknown"}
                      </span>
                    </>
                  ) : (
                    <span className="text-base font-normal md:font-medium leading-5 text-black text-right">
                      01/01/2026
                          </span>
                        )}
                      </div>
                <div className={`${extractedData && extractedData.status !== "failed" ? "grid gap-2 md:gap-4" : "flex flex-row justify-between"} items-start px-3 md:px-4 py-3 md:py-3 bg-[#F2F2F2]`} style={extractedData && extractedData.status !== "failed" ? { gridTemplateColumns: 'minmax(0, 1fr) minmax(80px, 1fr) minmax(80px, 1fr)', display: 'grid' } : {}}>
                  <span className="text-base font-normal md:font-medium leading-5 text-black">
                    Deductible
                  </span>
                  {extractedData && extractedData.status !== "failed" ? (
                    <>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-base font-normal md:font-medium leading-5 text-black text-right">
                          $1,000
                        </span>
                        <div className="flex-shrink-0 w-4">
                          {(() => {
                            const proposedDeductible = 1000;
                            const currentDeductible = getNumericValue(extractedData.coverages.deductible);
                            if (currentDeductible !== null) {
                              if (proposedDeductible > currentDeductible) {
                                // Proposed higher - trending up
                                return (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M16 8C15.4477 8 15 7.55228 15 7C15 6.44772 15.4477 6 16 6H22C22.5523 6 23 6.44772 23 7V13C23 13.5523 22.5523 14 22 14C21.4477 14 21 13.5523 21 13V9.41421L14.2071 16.2071C13.8166 16.5976 13.1834 16.5976 12.7929 16.2071L8.5 11.9142L2.70711 17.7071C2.31658 18.0976 1.68342 18.0976 1.29289 17.7071C0.902369 17.3166 0.902369 16.6834 1.29289 16.2929L7.79289 9.79289C8.18342 9.40237 8.81658 9.40237 9.20711 9.79289L13.5 14.0858L19.5858 8H16Z" fill="#EF4444"/>
                                  </svg>
                                );
                              } else if (proposedDeductible < currentDeductible) {
                                // Proposed cheaper - trending down
                                return (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M1.29289 6.29289C1.68342 5.90237 2.31658 5.90237 2.70711 6.29289L8.5 12.0858L12.7929 7.79289C13.1834 7.40237 13.8166 7.40237 14.2071 7.79289L21 14.5858V11C21 10.4477 21.4477 10 22 10C22.5523 10 23 10.4477 23 11V17C23 17.5523 22.5523 18 22 18H16C15.4477 18 15 17.5523 15 17C15 16.4477 15.4477 16 16 16H19.5858L13.5 9.91421L9.20711 14.2071C8.81658 14.5976 8.18342 14.5976 7.79289 14.2071L1.29289 7.70711C0.902369 7.31658 0.902369 6.68342 1.29289 6.29289Z" fill="#10B981"/>
                                  </svg>
                                );
                              }
                            }
                            return null;
                          })()}
                        </div>
                        </div>
                      <span className="text-base font-normal md:font-medium leading-5 text-black text-right">
                        {extractedData.coverages.deductible?.value
                          ? `$${extractedData.coverages.deductible.value.toLocaleString()}`
                          : "Unknown"}
                        </span>
                    </>
                  ) : (
                    <span className="text-base font-normal md:font-medium leading-5 text-black text-right">
                      $1,000
                          </span>
                        )}
                      </div>
                        </div>

              <div className="flex flex-row justify-between items-center px-3 md:px-4 py-3 md:py-2">
                <span className="text-base font-bold leading-5 text-black">
                  Standard coverages
                </span>
                {extractedData && extractedData.status !== "failed" ? (
                  <div className="grid gap-2 md:gap-4" style={{ gridTemplateColumns: 'minmax(80px, 1fr) minmax(80px, 1fr)', display: 'grid' }}>
                    {/* Empty space for alignment - headers are shown in carrier section */}
                        </div>
                ) : (
                  <span className="text-base font-normal leading-5 text-black text-right">
                    Coverage Limit
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                {[
                  { label: "Dwelling", value: 460000, key: "dwelling" },
                  { label: "Other structures", value: 46000, key: "otherStructures" },
                  { label: "Personal property", value: 322000, key: "personalProperty" },
                  { label: "Loss of use", value: 92000, key: "lossOfUse" },
                  { label: "Personal liability", value: 300000, key: "liability" },
                  { label: "Medical payment (to others)", value: 5000, key: "medPay" },
                    ].map((item, idx) => {
                  const currentValue = extractedData && extractedData.status !== "failed"
                    ? extractedData.coverages[item.key as keyof typeof extractedData.coverages]
                    : null;
                  
                  // Check if this coverage is explicitly excluded in notes
                  const isExcluded = extractedData && extractedData.status !== "failed" && extractedData.notes?.some(note => {
                    const noteLower = note.toLowerCase();
                    const coverageName = item.label.toLowerCase();
                    // Check for exclusion patterns with the coverage name
                    return (noteLower.includes('excluded') || noteLower.includes('not covered') || noteLower.includes('not included')) && 
                           (noteLower.includes(coverageName.split(' ')[0]) || // e.g., "earthquake", "flood", or "mold"
                            noteLower.includes(item.key.toLowerCase()) ||
                            (item.key === 'earthquake' && (noteLower.includes('earthquake') || noteLower.includes('seismic'))) ||
                            (item.key === 'flood' && noteLower.includes('flood')) ||
                            (item.key === 'moldPropertyDamage' && noteLower.includes('mold')) ||
                            (item.key === 'moldLiability' && noteLower.includes('mold')));
                  }) || false;

                      return (
                        <div
                          key={item.key}
                      className={`${extractedData && extractedData.status !== "failed" ? "grid gap-2 md:gap-4" : "flex flex-row justify-between"} items-start px-3 md:px-4 py-3 md:py-3 ${idx % 2 === 0 ? "bg-[#F2F2F2]" : ""}`}
                      style={extractedData && extractedData.status !== "failed" ? { gridTemplateColumns: 'minmax(0, 1fr) minmax(80px, 1fr) minmax(80px, 1fr)', display: 'grid' } : {}}
                        >
                      <span className="text-base font-normal md:font-medium leading-5 text-black">
                              {item.label}
                            </span>
                      {extractedData && extractedData.status !== "failed" ? (
                        <>
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-base font-normal md:font-medium leading-5 text-black text-right">
                              ${item.value.toLocaleString()}
                              </span>
                            <div className="flex-shrink-0 w-4">
                              {(() => {
                                const currentNum = getNumericValue(currentValue);
                                if (currentNum !== null && item.value > currentNum) {
                                  // Proposed higher - trending up
                                  return (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path fillRule="evenodd" clipRule="evenodd" d="M16 8C15.4477 8 15 7.55228 15 7C15 6.44772 15.4477 6 16 6H22C22.5523 6 23 6.44772 23 7V13C23 13.5523 22.5523 14 22 14C21.4477 14 21 13.5523 21 13V9.41421L14.2071 16.2071C13.8166 16.5976 13.1834 16.5976 12.7929 16.2071L8.5 11.9142L2.70711 17.7071C2.31658 18.0976 1.68342 18.0976 1.29289 17.7071C0.902369 17.3166 0.902369 16.6834 1.29289 16.2929L7.79289 9.79289C8.18342 9.40237 8.81658 9.40237 9.20711 9.79289L13.5 14.0858L19.5858 8H16Z" fill="#10B981"/>
                                    </svg>
                                  );
                                } else if (currentNum !== null && item.value < currentNum) {
                                  // Proposed lower - trending down
                                  return (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path fillRule="evenodd" clipRule="evenodd" d="M1.29289 6.29289C1.68342 5.90237 2.31658 5.90237 2.70711 6.29289L8.5 12.0858L12.7929 7.79289C13.1834 7.40237 13.8166 7.40237 14.2071 7.79289L21 14.5858V11C21 10.4477 21.4477 10 22 10C22.5523 10 23 10.4477 23 11V17C23 17.5523 22.5523 18 22 18H16C15.4477 18 15 17.5523 15 17C15 16.4477 15.4477 16 16 16H19.5858L13.5 9.91421L9.20711 14.2071C8.81658 14.5976 8.18342 14.5976 7.79289 14.2071L1.29289 7.70711C0.902369 7.31658 0.902369 6.68342 1.29289 6.29289Z" fill="#F97316"/>
                                    </svg>
                                  );
                                }
                                return null;
                              })()}
                          </div>
                          </div>
                          <span className="text-base font-normal md:font-medium leading-5 text-black text-right">
                            {currentValue?.value
                              ? typeof currentValue.value === "number"
                                ? `$${currentValue.value.toLocaleString()}`
                                : `$${currentValue.value}`
                              : "Unknown"}
                            </span>
                        </>
                      ) : (
                        <span className="text-base font-medium leading-5 text-black">
                          ${item.value.toLocaleString()}
                            </span>
                      )}
                        </div>
                      );
                    })}
                  </div>

              <div className="px-3 md:px-4 py-3 md:py-2">
                <span className="text-base font-bold leading-5 text-black block">
                  Additional coverages
                    </span>
              </div>

              <div className="flex flex-col">
                {[
                  { label: "Water back-up", value: 10000, key: "waterBackup", isIncluded: true },
                  { label: "Earthquake coverage", value: null, key: "earthquake", isIncluded: false },
                  { label: "Flood coverage", value: null, key: "flood", isIncluded: false },
                  { label: "Mold property damage", value: null, key: "moldPropertyDamage", isIncluded: false },
                  { label: "Mold liability", value: null, key: "moldLiability", isIncluded: false },
                    ].map((item, idx) => {
                  const currentValue = extractedData && extractedData.status !== "failed"
                    ? extractedData.coverages[item.key as keyof typeof extractedData.coverages]
                    : null;
                  
                  // Check if this coverage is explicitly excluded in notes or document
                  const isExcluded = extractedData && extractedData.status !== "failed" && (() => {
                    // First check notes for explicit exclusions
                    const hasExclusionInNotes = extractedData.notes?.some(note => {
                      const noteLower = note.toLowerCase();
                      const coverageName = item.label.toLowerCase();
                      // Check for exclusion patterns with the coverage name
                      return (noteLower.includes('excluded') || noteLower.includes('not covered') || noteLower.includes('not included') || 
                              noteLower.includes('does not insure') || noteLower.includes('does not cover')) && 
                             (noteLower.includes(coverageName.split(' ')[0]) || // e.g., "earthquake", "flood", or "mold"
                              noteLower.includes(item.key.toLowerCase()) ||
                              (item.key === 'earthquake' && (noteLower.includes('earthquake') || noteLower.includes('seismic'))) ||
                              (item.key === 'flood' && noteLower.includes('flood')) ||
                              (item.key === 'moldPropertyDamage' && noteLower.includes('mold')) ||
                              (item.key === 'moldLiability' && noteLower.includes('mold')));
                    });
                    
                    // Also check if coverage value is null AND there's any mention of exclusion in carrier/policy context
                    // This catches cases where exclusion is mentioned in the document but not explicitly in notes
                    if (!hasExclusionInNotes && (!currentValue?.value || currentValue.value === null)) {
                      // Check all coverage values and carrier name for exclusion context
                      const allCoverageValues = Object.values(extractedData.coverages || {})
                        .map(cov => String(cov?.value || ''))
                        .join(' ');
                      const carrierName = String(extractedData.policy.carrier?.value || '');
                      const allNotes = (extractedData.notes || []).join(' ');
                      const allText = `${allCoverageValues} ${carrierName} ${allNotes}`.toLowerCase();
                      
                      const coverageKeywords = item.key === 'flood' ? ['flood'] :
                                               item.key === 'earthquake' ? ['earthquake', 'seismic'] :
                                               item.key === 'moldPropertyDamage' || item.key === 'moldLiability' ? ['mold'] :
                                               [item.key.toLowerCase()];
                      
                      // Check if coverage keyword is mentioned with exclusion language
                      const hasExclusionLanguage = allText.includes('excluded') || 
                                                    allText.includes('not covered') || 
                                                    allText.includes('not included') ||
                                                    allText.includes('does not insure') ||
                                                    allText.includes('does not cover');
                      
                      const hasCoverageKeyword = coverageKeywords.some(keyword => allText.includes(keyword));
                      
                      // If exclusion language exists AND coverage keyword is mentioned, and value is null, it's likely excluded
                      return hasExclusionLanguage && hasCoverageKeyword;
                    }
                    
                    return hasExclusionInNotes || false;
                  })() || false;

                      return (
                        <div
                          key={item.key}
                      className={`${extractedData && extractedData.status !== "failed" ? "grid gap-2 md:gap-4" : "flex flex-row justify-between"} items-start px-3 md:px-4 py-3 md:py-3 ${idx % 2 === 1 ? "bg-[#F2F2F2]" : ""}`}
                      style={extractedData && extractedData.status !== "failed" ? { gridTemplateColumns: 'minmax(0, 1fr) minmax(80px, 1fr) minmax(80px, 1fr)', display: 'grid' } : {}}
                        >
                      <span className="text-base font-normal md:font-medium leading-5 text-black">
                              {item.label}
                            </span>
                      {extractedData && extractedData.status !== "failed" ? (
                        <>
                          <div className="flex items-center justify-end gap-2">
                            <span className={`text-base font-normal md:font-medium leading-5 text-right ${item.isIncluded ? "text-black" : "text-[#666]"}`}>
                              {item.isIncluded ? `$${item.value?.toLocaleString()}` : "Not Included"}
                              </span>
                            <div className="flex-shrink-0 w-4">
                              {(() => {
                                // If explicitly excluded, don't show comparison icons
                                if (isExcluded) {
                                  return null;
                                }
                                
                                const currentIsIncluded = currentValue?.value && typeof currentValue.value === "number";
                                const currentIsUnknown = !currentValue?.value || currentValue.value === "Unknown";
                                const proposedValue = item.isIncluded ? item.value : null;
                                const currentNum = getNumericValue(currentValue);
                                
                                // If both have numeric values, compare amounts
                                if (proposedValue !== null && typeof proposedValue === "number" && currentNum !== null) {
                                  if (proposedValue < currentNum) {
                                    // Proposed lower - trending down
                                    return (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 flex-shrink-0">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M1.29289 6.29289C1.68342 5.90237 2.31658 5.90237 2.70711 6.29289L8.5 12.0858L12.7929 7.79289C13.1834 7.40237 13.8166 7.40237 14.2071 7.79289L21 14.5858V11C21 10.4477 21.4477 10 22 10C22.5523 10 23 10.4477 23 11V17C23 17.5523 22.5523 18 22 18H16C15.4477 18 15 17.5523 15 17C15 16.4477 15.4477 16 16 16H19.5858L13.5 9.91421L9.20711 14.2071C8.81658 14.5976 8.18342 14.5976 7.79289 14.2071L1.29289 7.70711C0.902369 7.31658 0.902369 6.68342 1.29289 6.29289Z" fill="#EF4444"/>
                                      </svg>
                                    );
                                  } else if (proposedValue > currentNum) {
                                    // Proposed higher - trending up
                                    return (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 flex-shrink-0">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M16 8C15.4477 8 15 7.55228 15 7C15 6.44772 15.4477 6 16 6H22C22.5523 6 23 6.44772 23 7V13C23 13.5523 22.5523 14 22 14C21.4477 14 21 13.5523 21 13V9.41421L14.2071 16.2071C13.8166 16.5976 13.1834 16.5976 12.7929 16.2071L8.5 11.9142L2.70711 17.7071C2.31658 18.0976 1.68342 18.0976 1.29289 17.7071C0.902369 17.3166 0.902369 16.6834 1.29289 16.2929L7.79289 9.79289C8.18342 9.40237 8.81658 9.40237 9.20711 9.79289L13.5 14.0858L19.5858 8H16Z" fill="#10B981"/>
                                      </svg>
                                    );
                                  }
                                }
                                
                                // Fallback to inclusion/exclusion logic
                                if (item.isIncluded && !currentIsIncluded && !currentIsUnknown && !isExcluded) {
                                  // Proposed included, current not - green checkmark
                                  return (
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 flex-shrink-0">
                                      <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  );
                                } else if (!item.isIncluded && currentIsIncluded) {
                                  // Proposed not included, current included - red X
                                  return (
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 flex-shrink-0">
                                      <path d="M12 4L4 12M4 4l8 8" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  );
                                }
                                return null;
                              })()}
                          </div>
                          </div>
                          <span className={`text-base font-normal md:font-medium leading-5 text-right ${
                            (() => {
                              // If explicitly excluded, show as "Not Included" in gray
                              if (isExcluded) {
                                return "text-[#666]";
                              }
                              const currentIsIncluded = currentValue?.value && typeof currentValue.value === "number";
                              const currentIsUnknown = !currentValue?.value || currentValue.value === "Unknown";
                              
                              if (currentIsUnknown) {
                                return "text-black"; // Black: unknown
                              }
                              return currentValue?.value && typeof currentValue.value === "number" ? "text-black" : "text-[#666]";
                            })()
                          }`}>
                            {isExcluded 
                              ? "Not Included"
                              : currentValue?.value
                                ? typeof currentValue.value === "number"
                                  ? `$${currentValue.value.toLocaleString()}`
                                  : currentValue.value === null || currentValue.value === "Not Included"
                                    ? "Not Included"
                                    : `$${currentValue.value}`
                                : "Unknown"}
                            </span>
                        </>
                      ) : (
                        <span className={`text-base font-normal md:font-medium leading-5 min-w-[160px] text-right ${item.isIncluded ? "text-black" : "text-[#666]"}`}>
                          {item.isIncluded ? `$${item.value?.toLocaleString()}` : "Not Included"}
                            </span>
                      )}
                        </div>
                      );
                    })}
                </div>

              {/* Informational box for additional coverage opportunities - only show if detected in current policy */}
              {extractedData && extractedData.status !== "failed" && !isLoading && (() => {
                try {
                  // Check ALL coverage values and notes for exclusion keywords
                  const allCoverageValues = Object.values(extractedData.coverages || {})
                    .map(cov => String(cov?.value || ''))
                    .join(' ');
                  const carrierName = String(extractedData.policy.carrier?.value || '');
                  const allNotes = (extractedData.notes || []).join(' ');
                  const allText = `${allCoverageValues} ${carrierName} ${allNotes}`.toLowerCase();
                  
                  // Debug: Log extracted data to see what we're working with
                  console.log("Extracted data for detection:", {
                    notes: extractedData.notes,
                    coverages: extractedData.coverages,
                    carrier: extractedData.policy.carrier?.value,
                    effectiveDate: extractedData.policy.effectiveDate?.value,
                    expirationDate: extractedData.policy.expirationDate?.value,
                    premium: extractedData.policy.premium?.value,
                    allText: allText.substring(0, 500) // First 500 chars for debugging
                  });
                
                // Check for explicit exclusions
                const hasExclusionKeywords = (text: string) => {
                  const exclusionPatterns = [
                    'excluded', 'not covered', 'not included', 'not provided',
                    'exclusion', 'excludes', 'does not cover', 'no coverage',
                    'coverage excluded', 'not applicable', 'n/a', 'na'
                  ];
                  return exclusionPatterns.some(pattern => text.includes(pattern));
                };
                
                // Check earthquake - ONLY if INCLUDED with a numeric value, NOT if excluded
                const earthquakeValue = extractedData.coverages.earthquake?.value;
                const earthquakeText = allText.includes('earthquake') ? 
                  allText.substring(Math.max(0, allText.indexOf('earthquake') - 50), allText.indexOf('earthquake') + 100) : '';
                const currentHasEarthquake = 
                  earthquakeValue && 
                  typeof earthquakeValue === "number" && 
                  earthquakeValue > 0 &&
                  !hasExclusionKeywords(earthquakeText);
                
                // Check flood - ONLY if INCLUDED with a numeric value, NOT if excluded
                const floodValue = extractedData.coverages.flood?.value;
                const floodText = allText.includes('flood') ? 
                  allText.substring(Math.max(0, allText.indexOf('flood') - 50), allText.indexOf('flood') + 100) : '';
                const currentHasFlood = 
                  floodValue && 
                  typeof floodValue === "number" && 
                  floodValue > 0 &&
                  !hasExclusionKeywords(floodText);
                
                // SIMPLIFIED LOGIC: Check if jewelry, scheduled personal property, or floater are mentioned AND included
                
                // Helper function to check if a coverage is mentioned and included (not excluded)
                const isCoverageIncluded = (coverageKeywords: string[], contextText?: string): boolean => {
                  // Check if any keyword is mentioned in the document
                  const isMentioned = coverageKeywords.some(keyword => 
                    allText.includes(keyword.toLowerCase()) ||
                    extractedData.notes?.some(note => note.toLowerCase().includes(keyword.toLowerCase()))
                  );
                  
                  if (!isMentioned) return false;
                  
                  // Get context around the mention to check for exclusions
                  const keywordFound = coverageKeywords.find(keyword => 
                    allText.includes(keyword.toLowerCase())
                  );
                  
                  if (!keywordFound) {
                    // Check notes instead
                    const noteWithKeyword = extractedData.notes?.find(note => 
                      coverageKeywords.some(kw => note.toLowerCase().includes(kw.toLowerCase()))
                    );
                    if (noteWithKeyword) {
                      return !hasExclusionKeywords(noteWithKeyword.toLowerCase());
                    }
                    return false;
                  }
                  
                  // Get context text around the keyword
                  const keywordIndex = allText.indexOf(keywordFound.toLowerCase());
                  const context = contextText || 
                    allText.substring(Math.max(0, keywordIndex - 100), keywordIndex + 200);
                  
                  // Check if it's excluded in the context
                  return !hasExclusionKeywords(context);
                };
                
                // Check for jewelry (including scheduled personal property - jewelry)
                const jewelryKeywords = ['jewelry', 'jewellery', 'scheduled personal property', 'scheduled property'];
                const jewelryContext = allText.includes('jewelry') || allText.includes('jewellery') ?
                  allText.substring(Math.max(0, Math.max(
                    allText.indexOf('jewelry') > -1 ? allText.indexOf('jewelry') : 0,
                    allText.indexOf('jewellery') > -1 ? allText.indexOf('jewellery') : 0
                  ) - 100), Math.max(
                    allText.indexOf('jewelry') > -1 ? allText.indexOf('jewelry') + 200 : allText.length,
                    allText.indexOf('jewellery') > -1 ? allText.indexOf('jewellery') + 200 : allText.length
                  )) : '';
                
                // Check if jewelry is mentioned AND included (not excluded)
                const jewelryIsMentioned = allText.includes('jewelry') || 
                                          allText.includes('jewellery') ||
                                          extractedData.notes?.some(note => 
                                            note.toLowerCase().includes('jewelry') || 
                                            note.toLowerCase().includes('jewellery')
                                          );
                
                const jewelryIsIncluded = jewelryIsMentioned && (
                  (extractedData.coverages.jewelry?.value && typeof extractedData.coverages.jewelry.value === "number" && extractedData.coverages.jewelry.value > 0) ||
                  isCoverageIncluded(['jewelry', 'jewellery', 'scheduled personal property'], jewelryContext)
                );
                
                // Check for scheduled personal property (general, not just jewelry)
                const scheduledPropertyKeywords = ['scheduled personal property', 'scheduled property', 'scheduled personal', 'scheduled items'];
                const scheduledPropertyContext = allText.includes('scheduled') ?
                  allText.substring(Math.max(0, allText.indexOf('scheduled') - 50), allText.indexOf('scheduled') + 200) : '';
                
                const scheduledPropertyIsMentioned = scheduledPropertyKeywords.some(keyword => 
                  allText.includes(keyword.toLowerCase()) ||
                  extractedData.notes?.some(note => note.toLowerCase().includes(keyword.toLowerCase()))
                );
                
                const scheduledPropertyIsIncluded = scheduledPropertyIsMentioned && 
                  isCoverageIncluded(scheduledPropertyKeywords, scheduledPropertyContext);
                
                // Check for floater/PAF (Personal Articles Floater)
                const floaterKeywords = ['floater', 'paf', 'personal articles floater', 'scheduled personal property'];
                const floaterContext = allText.includes('floater') || allText.includes('paf') ?
                  allText.substring(Math.max(0, Math.max(
                    allText.indexOf('floater') > -1 ? allText.indexOf('floater') : 0,
                    allText.indexOf('paf') > -1 ? allText.indexOf('paf') : 0
                  ) - 50), Math.max(
                    allText.indexOf('floater') > -1 ? allText.indexOf('floater') + 150 : allText.length,
                    allText.indexOf('paf') > -1 ? allText.indexOf('paf') + 150 : allText.length
                  )) : '';
                
                const floaterIsMentioned = floaterKeywords.some(keyword => 
                  allText.includes(keyword.toLowerCase()) ||
                  extractedData.notes?.some(note => note.toLowerCase().includes(keyword.toLowerCase()))
                );
                
                const floaterIsIncluded = floaterIsMentioned && 
                  isCoverageIncluded(floaterKeywords, floaterContext);
                
                // Check for electronic devices coverage
                const electronicKeywords = ['electronic', 'electronics', 'electronic device', 'electronic devices', 
                                          'computer', 'computers', 'laptop', 'laptops', 'tablet', 'tablets', 
                                          'smartphone', 'smartphones', 'phone', 'phones', 'camera', 'cameras',
                                          'television', 'tv', 'televisions', 'tvs'];
                const electronicContext = electronicKeywords.some(keyword => allText.includes(keyword.toLowerCase())) ?
                  allText.substring(Math.max(0, Math.max(...electronicKeywords.map(kw => 
                    allText.indexOf(kw.toLowerCase()) > -1 ? allText.indexOf(kw.toLowerCase()) : 0
                  ).filter(idx => idx > 0)) - 50), Math.max(...electronicKeywords.map(kw => 
                    allText.indexOf(kw.toLowerCase()) > -1 ? allText.indexOf(kw.toLowerCase()) + 150 : allText.length
                  ).filter(idx => idx < allText.length))) : '';
                
                const electronicIsMentioned = electronicKeywords.some(keyword => 
                  allText.includes(keyword.toLowerCase()) ||
                  extractedData.notes?.some(note => note.toLowerCase().includes(keyword.toLowerCase()))
                );
                
                const electronicIsIncluded = electronicIsMentioned && 
                  isCoverageIncluded(electronicKeywords, electronicContext);
                
                // Set flags for promotion
                const currentHasJewelry = jewelryIsIncluded;
                const hasJewelryMention = jewelryIsMentioned && jewelryIsIncluded;
                const hasScheduledProperty = scheduledPropertyIsIncluded;
                const currentHasPAF = floaterIsIncluded;
                const currentHasElectronic = electronicIsIncluded;
                
                // Also check carrier name or notes for flood mentions - but only if not excluded
                const hasFloodMention = 
                  (extractedData.notes?.some(note => note.toLowerCase().includes('flood')) || 
                   String(extractedData.policy.carrier?.value || '').toLowerCase().includes('flood')) &&
                  !hasExclusionKeywords(floodText);
                
                // SIMPLIFIED: Show promotional section if coverage is mentioned AND included (not excluded)
                // Check what's in PROPOSED policy (for comparison, but promotion shows if included in current)
                const proposedHasEarthquake = false; // Earthquake is not included in proposed
                const proposedHasFlood = false; // Flood is not included in proposed
                const proposedHasJewelry = false; // Jewelry is not included in proposed
                
                // Show promotional section if:
                // 1. Coverage is mentioned in CURRENT policy
                // 2. Coverage is INCLUDED (not excluded) in CURRENT policy
                // 3. Coverage does NOT exist in PROPOSED policy (optional - for comparison)
                const shouldPromoteEarthquake = currentHasEarthquake && !proposedHasEarthquake;
                const shouldPromoteFlood = (currentHasFlood || hasFloodMention) && !proposedHasFlood;
                const shouldPromoteJewelry = (currentHasJewelry || hasJewelryMention || hasScheduledProperty) && !proposedHasJewelry;
                const shouldPromotePAF = currentHasPAF;
                const shouldPromoteElectronic = currentHasElectronic;
                
                // Debug: Log detection results
                console.log("Detection results:", {
                  jewelryIsMentioned,
                  jewelryIsIncluded,
                  scheduledPropertyIsMentioned,
                  scheduledPropertyIsIncluded,
                  floaterIsMentioned,
                  floaterIsIncluded,
                  currentHasJewelry,
                  hasJewelryMention,
                  hasScheduledProperty,
                  currentHasPAF,
                  shouldPromoteJewelry
                });
                
                // Show promotional section if coverage is INCLUDED in current policy
                if (shouldPromoteEarthquake || shouldPromoteFlood || shouldPromoteJewelry || shouldPromotePAF || shouldPromoteElectronic) {
                  const coverages = [];
                  const opportunities = [];
                  
                  if (shouldPromoteEarthquake) coverages.push("Earthquake");
                  if (shouldPromoteFlood) coverages.push("Flood");
                  
                  // Determine what opportunities to promote based on what's included
                  if (shouldPromoteJewelry) {
                    // Check if jewelry is specifically mentioned (including in scheduled property context)
                    if (jewelryIsIncluded || (hasScheduledProperty && jewelryIsMentioned)) {
                      opportunities.push("Jewelry");
                    } else if (scheduledPropertyIsIncluded) {
                      opportunities.push("Scheduled Personal Property");
                    }
                  }
                  
                  // Add PAF if included
                  if (shouldPromotePAF) {
                    opportunities.push("Personal Articles Floater (PAF)");
                  }
                  
                  // Add electronic devices if included
                  if (shouldPromoteElectronic) {
                    opportunities.push("Electronic Devices");
                  }
                  
                  return (
                    <div className="mx-3 md:mx-4 mt-3 md:mt-4 p-3 md:p-4 bg-[#EFF6FF] border border-[#3B82F6] rounded-lg">
                      <div className="flex items-start gap-3">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mt-0.5">
                          <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 6V10M10 14H10.01" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-[#1E40AF] mb-1">
                            Consider Additional Coverage
                          </h3>
                          <p className="text-sm text-[#1E3A8A] leading-relaxed">
                            {(() => {
                              let message = "";
                              
                              // Add coverage recommendations
                              if (coverages.length > 0) {
                                message += `${coverages.join(", ")} coverage${coverages.length > 1 ? "s" : ""} can provide important protection for your property. `;
                              }
                              
                              // Add insurance opportunities (scheduled property, jewelry, PAF, or electronic devices)
                              if (opportunities.length > 0) {
                                const isJewelry = opportunities.includes("Jewelry");
                                const isPAF = opportunities.includes("Personal Articles Floater (PAF)");
                                const isElectronic = opportunities.includes("Electronic Devices");
                                
                                if (isJewelry) {
                                  message += `We noticed you have jewelry coverage in your current policy. This represents an insurance opportunity - consider a dedicated jewelry insurance policy for comprehensive protection of your valuable items beyond your standard coverage limits. `;
                                } else if (isPAF) {
                                  message += `We noticed you have Personal Articles Floater (PAF) coverage in your current policy. This represents an insurance opportunity - consider a dedicated floater policy for comprehensive protection of your valuable items beyond your standard coverage limits. `;
                                } else if (isElectronic) {
                                  message += `We noticed you have electronic devices coverage in your current policy. This represents an insurance opportunity - consider a dedicated electronics insurance policy for comprehensive protection of your devices (computers, laptops, tablets, smartphones, cameras, TVs, etc.) beyond your standard coverage limits. `;
                                } else {
                                  message += `We noticed you have ${opportunities.join(" or ")} coverage in your current policy. This represents an insurance opportunity - consider a dedicated policy for your valuable items (such as jewelry, art, collectibles, or other scheduled property) to ensure comprehensive protection beyond your standard coverage limits. `;
                                }
                              }
                              
                              if (coverages.length > 0 || opportunities.length > 0) {
                                message += "We recommend discussing these options with your insurance agent to ensure you have adequate coverage for your specific needs.";
                              }
                              
                              return message;
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              } catch (error) {
                console.error("Error in detection logic:", error);
                return null;
              }
            })()}
              </div>

            {/* Loading State - Show inline when processing */}
            {isLoading && (
              <div className="flex items-center justify-center py-3 md:py-4 gap-2">
                <div
                  className="w-2 h-2 bg-[#156EEA] rounded-full animate-bounce"
                  style={{ animationDelay: "0s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-[#156EEA] rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-[#156EEA] rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></div>
                <span className="text-sm font-medium text-[#666] ml-2">
                  Extracting policy data...
                </span>
              </div>
            )}

            <div className="h-px bg-[#D9D9D9]"></div>

            {/* Yearly Premium - Show comparison if data available */}
            <div className={`${extractedData && extractedData.status !== "failed" ? "grid gap-2 md:gap-4" : "flex flex-col md:flex-row items-start gap-1 justify-between"} items-start px-3 md:px-4 py-3 md:py-3`} style={extractedData && extractedData.status !== "failed" ? { gridTemplateColumns: 'minmax(0, 1fr) minmax(80px, 1fr) minmax(80px, 1fr)', display: 'grid' } : {}}>
              <div className="flex flex-col gap-1 mb-2 md:mb-0">
              <span className="text-2xl font-bold leading-8 text-[#111827]">
                Yearly premium
              </span>
                {extractedData && extractedData.status !== "failed" && !isLoading && (() => {
                  const difference = calculatePremiumDifference();
                  if (difference) {
                    return (
                      <span className={`text-sm font-semibold whitespace-nowrap ${
                        difference.isCheaper ? "text-[#10B981]" : "text-[#F97316]"
                      }`}>
                        {difference.isCheaper ? "Savings" : "Premium difference"}: ${difference.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
              {extractedData && extractedData.status !== "failed" && !isLoading ? (
                <>
                  <div className="flex items-center justify-start md:justify-end gap-2">
                    <span className="text-2xl font-bold leading-8 text-left md:text-right text-[#111827] flex-1">
                      $1,677.00
                    </span>
                    <div className="flex-shrink-0 w-5">
                      {(() => {
                        const difference = calculatePremiumDifference();
                        if (difference) {
                          if (difference.isCheaper) {
                            // Proposed cheaper - trending down
                            return (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M1.29289 6.29289C1.68342 5.90237 2.31658 5.90237 2.70711 6.29289L8.5 12.0858L12.7929 7.79289C13.1834 7.40237 13.8166 7.40237 14.2071 7.79289L21 14.5858V11C21 10.4477 21.4477 10 22 10C22.5523 10 23 10.4477 23 11V17C23 17.5523 22.5523 18 22 18H16C15.4477 18 15 17.5523 15 17C15 16.4477 15.4477 16 16 16H19.5858L13.5 9.91421L9.20711 14.2071C8.81658 14.5976 8.18342 14.5976 7.79289 14.2071L1.29289 7.70711C0.902369 7.31658 0.902369 6.68342 1.29289 6.29289Z" fill="#10B981"/>
                              </svg>
                            );
                          } else {
                            // Proposed more expensive - trending up
                            return (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M16 8C15.4477 8 15 7.55228 15 7C15 6.44772 15.4477 6 16 6H22C22.5523 6 23 6.44772 23 7V13C23 13.5523 22.5523 14 22 14C21.4477 14 21 13.5523 21 13V9.41421L14.2071 16.2071C13.8166 16.5976 13.1834 16.5976 12.7929 16.2071L8.5 11.9142L2.70711 17.7071C2.31658 18.0976 1.68342 18.0976 1.29289 17.7071C0.902369 17.3166 0.902369 16.6834 1.29289 16.2929L7.79289 9.79289C8.18342 9.40237 8.81658 9.40237 9.20711 9.79289L13.5 14.0858L19.5858 8H16Z" fill="#F97316"/>
                              </svg>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <span className="text-2xl font-bold leading-8 text-[#111827] text-left md:text-right">
                    {extractedData.policy.premium?.value
                      ? typeof extractedData.policy.premium.value === "number"
                        ? `$${extractedData.policy.premium.value.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : `$${extractedData.policy.premium.value}`
                      : "Unknown"}
                  </span>
                </>
              ) : (
              <span className="text-2xl font-bold leading-8 text-[#111827]">
                  $1,677.00
              </span>
              )}
            </div>
          </div>
        </div>

        {/* Umbrella Insurance Details */}
        <div className="rounded-lg border border-[#E6E6E6] p-3 md:p-6 flex flex-col gap-5 mb-6">
          <div className="flex flex-col gap-1 px-3 md:px-1">
            <h2 className="text-2xl font-bold leading-8 text-[#111827]">
              Umbrella insurance details
            </h2>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-start px-3 md:px-1">
              <span className="text-base font-normal leading-5 text-black">
                Carrier
              </span>
              {(() => {
                const carrierName = "allstate";
                const logoUrl = CARRIER_LOGOS[carrierName];
                
                return (
                  <>
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="ALLSTATE"
                        className="max-h-[30px] object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.carrier-text-fallback')) {
                            const div = document.createElement('div');
                            div.className = 'w-[120px] h-[30px] bg-[#0A3066] flex items-center justify-center rounded';
                            const span = document.createElement('span');
                            span.className = 'text-white font-bold text-sm';
                            span.textContent = 'ALLSTATE';
                            div.appendChild(span);
                            parent.appendChild(div);
                          }
                        }}
                      />
                    ) : (
              <div className="w-[120px] h-[30px] bg-[#0A3066] flex items-center justify-center rounded">
                <span className="text-white font-bold text-sm">ALLSTATE</span>
              </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-start px-3 md:px-1">
                <span className="text-base font-bold leading-5 text-black">
                  Policy Basics
                </span>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-start px-3 md:px-1 py-3 md:py-2">
                  <span className="text-base font-normal md:font-medium leading-5 text-black">
                    Policy Start Date
                  </span>
                  <span className="text-base font-normal md:font-medium leading-5 text-black">
                    01/01/2026
                  </span>
                </div>
                <div className="flex justify-between items-start px-3 md:px-1 py-3 md:py-2 bg-[#F2F2F2]">
                  <span className="text-base font-normal md:font-medium leading-5 text-black">
                    Deductible
                  </span>
                  <span className="text-base font-normal md:font-medium leading-5 text-black">
                    $0
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-start px-3 md:px-1">
                <span className="text-base font-normal leading-5 text-black">
                  Coverages
                </span>
                <span className="text-base font-normal leading-5 text-black text-right ml-auto md:ml-0">
                  Coverage Limit
                </span>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-start px-3 md:px-1 py-3 md:py-2 bg-[#F2F2F2]">
                  <span className="text-base font-medium leading-5 text-black flex-1">
                    Extended replacement cost on content
                  </span>
                  <span className="text-base font-medium leading-5 text-black">
                    $1,245
                  </span>
                </div>
              </div>
            </div>

            <div className="h-px bg-[#D9D9D9]"></div>

            <div className="flex items-start gap-1 justify-between">
              <span className="text-2xl font-bold leading-8 text-[#111827]">
                Yearly premium
              </span>
              <span className="text-2xl font-bold leading-8 text-[#111827]">
                $1,234.00
              </span>
            </div>
          </div>
        </div>

        {/* Want to Save More */}
        <div className="rounded-lg bg-[#E8F8E8] p-3 md:p-10 flex flex-col md:flex-row items-start gap-6 mb-6">
          <div className="flex-1 flex flex-col gap-3">
            <h2 className="text-[28px] md:text-[32px] font-bold leading-[1.25] text-black">
              Want to save even more?
            </h2>
            <p className="text-lg md:text-xl font-medium leading-[1.4] text-black">
              Did you know you could save up to 20% when Matic shops your auto
              insurance, too? We work hard to find discounts – even checking to
              see if using two carriers gets better rates than bundling. Chat
              with a licensed advisor to get a free auto quote.
            </p>
            <button className="flex px-3 md:px-5 py-3 md:py-3 justify-center items-center gap-3 rounded bg-[#156EEA] text-white text-base font-bold leading-5 hover:bg-[#1257c7] transition-colors">
              Contact Your Advisor
            </button>
          </div>
        </div>

        {/* Why Customers Choose Matic */}
        <div className="rounded-lg bg-[#F1EBFF] p-3 md:p-10 flex flex-col md:flex-row items-start gap-10 mb-6">
          <div className="flex-1 flex flex-col gap-10">
            <h2 className="text-[28px] md:text-[32px] font-bold leading-[1.25] text-black">
              Why customers choose Matic
            </h2>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold leading-7 text-black">
                  Ongoing support
                </h3>
                <p className="text-base font-medium leading-5 text-black">
                  In addition to your carrier, Matic is an extra insurance
                  advocate there to help you navigate issues with your policy.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold leading-7 text-black">
                  Transparency
                </h3>
                <p className="text-base font-medium leading-5 text-black">
                  Our advisors are not paid based on your premium, so our motive
                  is to find the best price and policy options for you.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold leading-7 text-black">
                  Peace of mind
                </h3>
                <p className="text-base font-medium leading-5 text-black">
                  If your premium increases in the future, you can rely on
                  Matic's network of 40+ A-rated carriers to help find a better
                  option.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="rounded-lg bg-[#F2F2F2] p-3 md:p-10 flex flex-col gap-3">
          <p className="text-sm font-medium leading-5 text-[#333]">
            Quotes are estimates only. Quotes are subject to change without
            notice. Your actual rate, payment and coverage may be different.
            Quotes do not constitute a final offer of insurance, nor is any
            contract, agreement, or insurance coverage implied, formed or bound
            by the provision of this quote. Insurability, final insurance
            premium quotes and an offer of insurance is determined by the
            insurance company providing your insurance policy. *The coverages in
            this offer may differ from the coverages in your existing policy.
            Prior to accepting the offer, please review and ensure you are
            adequately covered in the event of a loss
          </p>
        </div>
      </div>

      {/* Select Offer - Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-5 bg-white pt-3 md:pt-5 px-3 md:px-20 pb-3 md:pb-5 border-t border-[#D9D9D9] z-40 shadow-lg">
        <p className="text-sm md:text-base font-medium leading-5 text-black flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
          By clicking "Select Offer," you acknowledge that you have reviewed the details of your policy offer, including all coverage limits, deductibles, and premiums.
        </p>
        <button className="flex px-3 md:px-5 py-3 md:py-3 justify-center items-center gap-3 rounded bg-[#156EEA] text-white text-base font-bold leading-5 whitespace-nowrap hover:bg-[#1257c7] transition-colors w-full md:w-auto">
          Select Offer
        </button>
      </div>
    </div>
  );
}
