import { useState } from 'react';
import { parsePDF, type ExtractionResponse } from '../lib/pdfParser';

export default function Index() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      setParseError('Please upload a PDF or image file (JPG, PNG, HEIC)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setParseError('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    setIsLoading(true);
    setParseError(null);
    setExtractedData(null);

    try {
      const response = await parsePDF(file);
      setExtractedData(response);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      if (response.status === 'failed') {
        setParseError(response.error || 'Failed to extract document data');
      } else {
        setParseError(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setParseError(message);
      setExtractedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplaceDocument = () => {
    const input = document.getElementById('file-upload') as HTMLInputElement;
    input?.click();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}
      <div className="max-w-[900px] mx-auto px-5 md:px-20 py-10 pb-10 flex-1" style={{ minHeight: "1349px" }}>
        {/* Header */}
        <div className="flex justify-center items-center gap-3 mb-3">
          <svg width="96" height="32" viewBox="0 0 96 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_6993_23584)">
              <path d="M74.5466 20.5613L75.4715 21.2624C74.5466 22.6648 72.6939 23.9379 71.0779 24.3009C68.9967 24.7683 67.1417 24.5443 65.2941 23.5614C62.2906 21.9636 61.25 18.9252 61.8281 15.8868C62.4654 12.8184 64.603 10.9786 67.6092 10.2774C69.4592 9.80981 71.7582 10.0632 73.2623 11.1012C74.7778 12.1472 75.2403 13.0627 75.2403 14.4844C75.2403 15.3025 74.7778 16.1205 73.8528 16.3542C71.6733 16.9049 70.6154 15.1856 71.0947 13.4305C71.317 12.6168 70.841 12.0444 70.0956 11.7314C68.3029 10.9785 66.9155 12.8483 66.6842 14.4844C66.2217 17.7566 67.378 21.7299 71.0779 21.9636C72.6976 22.0659 73.8528 21.2624 74.5466 20.5613Z" fill="black"/>
              <path d="M87.4692 16.5013C87.5073 16.4726 87.5507 16.4866 87.6045 16.5409L93.9588 22.9634C94.0719 23.0778 94.1228 23.2117 94.0097 23.3261L90.9189 26.4501C90.8057 26.5644 90.6223 26.5644 90.5092 26.4501L87.3861 23.2935C87.2895 23.1959 87.2752 23.0445 87.3439 22.9282C88.7459 20.5542 88.1185 18.0041 87.4464 16.6446C87.4131 16.5772 87.4311 16.5301 87.4692 16.5013Z" fill="#408DF6"/>
              <path d="M86.6795 23.9188C86.7933 23.7933 86.9396 23.8336 87.0612 23.9566L90.0187 26.9458C90.1318 27.0601 90.1827 27.1941 90.0696 27.3084L87.0946 30.3153C86.9815 30.4296 86.7981 30.4296 86.6849 30.3153L82.9321 26.5222C82.8426 26.4318 82.829 26.3074 82.866 26.2038C82.9028 26.1005 82.9917 26.0121 83.114 25.9915C84.7018 25.7233 86.043 24.6213 86.6795 23.9188Z" fill="#66A4F7"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M82.7057 14.4899C85.396 14.4899 87.5769 16.6942 87.5769 19.4134C87.5769 22.1325 85.396 24.3368 82.7057 24.3368C80.0154 24.3368 77.8345 22.1325 77.8345 19.4134C77.8345 16.6942 80.0154 14.4899 82.7057 14.4899Z" fill="#EA4D72"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M91.1815 14.393C93.8718 14.393 96.0527 16.5973 96.0527 19.3164C96.0527 20.4927 95.6444 21.573 94.9633 22.4198C94.8337 22.581 94.5997 22.5828 94.4601 22.4417L88.0894 16.0027C87.9498 15.8616 87.9516 15.625 88.111 15.4941C88.9489 14.8057 90.0177 14.393 91.1815 14.393Z" fill="#1E74EB"/>
              <path d="M0.0527344 6.53952V5.13717H6.99009C7.22133 5.13721 7.5682 5.25404 7.68382 5.60462C9.37964 9.29297 12.7712 16.5897 12.7712 16.5897L17.6148 5.58866C17.743 5.25404 18.0898 5.13717 18.3211 5.13717H25.2584V6.53952C23.871 6.77325 22.946 7.00697 22.946 8.64305C22.9429 12.7088 22.9445 16.731 22.946 20.7967C22.946 22.1991 24.144 22.6665 25.4897 23.143V24.3318H15.3149V23.134C16.7024 22.6665 17.6274 22.1991 17.6274 20.7967C17.6367 17.1872 17.6677 13.6549 17.6274 10.0454C17.6274 10.0454 13.136 20.5267 12.54 21.7316C12.1931 22.4328 11.8462 22.9003 11.3837 22.9003C10.8056 22.9003 10.4588 22.6665 9.99627 21.7316C8.22535 18.2244 4.44639 10.0454 4.44639 10.0454L4.44639 20.7967C4.44639 22.2049 5.60262 22.6665 6.99009 23.134V24.3026H0.0527348V23.134C1.4402 22.6665 2.36519 22.1991 2.36519 20.7997C2.36672 16.8165 2.36519 12.86 2.36519 8.87678C2.36519 7.2407 1.4402 7.00697 0.0527344 6.53952Z" fill="black"/>
              <path d="M41.6763 22.4323C41.6763 23.6009 40.5295 24.5358 38.9014 24.5358C36.3577 24.5358 35.552 22.1389 35.552 22.1389C33.814 24.0684 31.8484 25.1201 28.8631 24.1943C26.5545 23.4784 26.0105 20.4335 27.7624 18.7438C29.5703 17.0029 31.725 16.6486 34.0453 16.3554C34.9702 16.2386 35.664 15.6543 35.664 14.9531C35.664 13.5309 35.664 11.4472 33.814 11.4472C31.5016 11.4472 32.889 13.7845 31.5016 15.1868C30.6369 16.0608 29.2972 16.0488 28.3782 15.4109C27.6731 14.9223 27.3572 14.0267 27.7778 13.091C28.7266 10.9798 31.5944 10.4042 33.5828 10.2786C39.1327 9.92812 40.2889 11.9146 40.2889 16.3555C40.2889 17.8793 40.2889 21.0299 40.2889 21.0299C40.2889 21.9481 40.5201 22.666 41.6763 22.4323ZM35.664 18.6927C35.664 17.2903 34.739 17.4072 32.978 17.9596C32.002 18.2657 31.5016 19.1601 31.3724 20.0928C31.1792 21.4876 31.9641 21.9648 33.0919 21.9755C34.5077 21.9889 35.664 20.5625 35.664 18.6927Z" fill="black"/>
              <path d="M41.1471 10.9792C43.6907 10.278 44.8037 9.94165 45.5407 7.70697C45.7719 7.0058 46.2344 6.77207 46.9282 6.77207C47.6219 6.77207 47.8531 7.00579 47.8531 7.70702C47.8485 8.28428 47.8562 8.76583 47.8531 9.34309C47.8485 10.0371 48.3156 10.5117 49.2406 10.5117H52.2505L52.2468 11.9141C52.2468 11.9141 50.0845 11.9036 49.2406 11.9141C48.3139 11.9265 47.8624 12.3844 47.8531 13.3164C47.8531 15.6537 47.8531 17.7572 47.8531 20.3282C47.8531 22.198 49.2406 23.1328 51.2062 22.081L51.7843 22.8991C50.3968 24.0677 49.0094 24.5352 47.1594 24.5352C45.3095 24.5352 43.2283 22.8991 43.2283 20.3282V13.3164C43.2283 12.3815 42.3033 11.9141 41.1471 11.9141V10.9792Z" fill="black"/>
              <path d="M61.4964 24.3014H53.1716L53.1716 23.1327C54.3278 22.899 55.026 22.4316 55.026 21.4923L55.0368 13.55C55.0368 12.615 54.5591 11.9139 53.1716 11.9139L51.7841 11.9138V10.5115C51.7841 10.5115 51.3173 10.5115 53.1694 10.5115C55.0216 10.5115 56.6403 10.161 57.7965 10.0441C58.9527 9.92716 59.6464 10.2779 59.6464 11.4465C59.6481 14.709 59.6464 21.4967 59.6464 21.4967C59.6464 22.4316 60.3402 22.899 61.4964 23.1327L61.4964 24.3014Z" fill="black"/>
              <path d="M59.4153 6.42221C59.4153 7.90666 58.2246 9.11005 56.7559 9.11005C55.2872 9.11005 54.0966 7.90666 54.0966 6.42221C54.0966 4.93776 55.2872 3.73438 56.7559 3.73438C58.2246 3.73438 59.4153 4.93776 59.4153 6.42221Z" fill="black"/>
            </g>
            <defs>
              <clipPath id="clip0_6993_23584">
                <rect width="96" height="32" fill="white"/>
              </clipPath>
            </defs>
          </svg>
        </div>

        {/* Review Banner */}
        <div className="rounded-lg bg-[#E5F1FF] p-6 md:p-10 flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
          <div className="flex-1 flex flex-col gap-6">
            <h1 className="text-[32px] md:text-[40px] font-bold leading-[1.3] text-black">
              Review your insurance offer
            </h1>
            <div className="flex items-start gap-6 bg-transparent rounded-lg p-3">
              <div className="w-16 h-16 flex-shrink-0">
                <svg width="64" height="60" viewBox="0 0 64 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="30.2679" cy="30.6813" rx="29.7777" ry="29.32" fill="#66A4F7"/>
                </svg>
              </div>
              <div className="flex-1 flex flex-col gap-3">
                <p className="text-base font-medium text-black leading-5">
                  I'm Maria, your [state] licensed insurance advisor. I've helped 656 customers protect their most important belongings.
                </p>
                <div className="flex flex-wrap items-start gap-6">
                  <div className="flex items-start gap-2">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M6.31623 6.94868C6.72457 6.81257 7 6.43043 7 6V3C7 1.34315 5.65685 0 4 0H1C0.447715 0 0 0.447715 0 1C0 8.85472 7.14528 16 15 16C15.5523 16 16 15.5523 16 15V12C16 10.3431 14.6569 9 13 9H10C9.56957 9 9.18743 9.27543 9.05132 9.68377L8.30429 11.9248C6.74458 10.9124 5.37501 9.58197 4.31438 8.05221L4.07516 7.69571L6.31623 6.94868ZM10.7208 11H13C13.5523 11 14 11.4477 14 12V13.9546C12.7978 13.8457 11.621 13.5439 10.503 13.0828L10.0866 12.9024L10.7208 11ZM2.04542 2H4C4.55228 2 5 2.44772 5 3V5.27924L3.09757 5.91338C2.53454 4.67278 2.16796 3.35246 2.04542 2Z" fill="black"/>
                    </svg>
                    <span className="font-bold text-base leading-5 text-black">653-762-8273</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M13 4C14.6569 4 16 5.34315 16 7V13C16 14.6569 14.6569 16 13 16H3C1.34315 16 0 14.6569 0 13V7C0 5.34315 1.34315 4 3 4H13ZM14 7.3L8.6585 11.7526C8.3129 12.055 7.81106 12.0802 7.43941 11.8282L7.3415 11.7526L2 7.301V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V7.3ZM12.432 6H3.567L8 9.67123L12.432 6Z" fill="black"/>
                    </svg>
                    <span className="font-bold text-base leading-5 text-black">maria.su@matic.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Offer Summary */}
        <div className="rounded-lg border border-[#E6E6E6] bg-white p-6 flex flex-col gap-5 mb-6">
          <h2 className="text-[32px] font-bold leading-[40px] text-black">Offer summary</h2>
          
          <div className="flex flex-col gap-5">
            {/* Premiums */}
            <div className="flex flex-col gap-1">
              <div className="flex items-start gap-2 justify-between">
                <div className="flex items-start gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.41992 9.09375V21.75H20.3306V9.09375" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M1.88867 11.2634L12.3753 1.5L22.8619 11.2634" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.48242 21.7503V13.7949H15.2681V21.7503" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-base font-medium leading-5 text-black">Home insurance(annual)</span>
                </div>
                <span className="text-base font-medium leading-5 text-black text-right">$2,083.00</span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-base font-bold leading-5 text-[#2F8802]">Premium difference compared to current policy*</span>
                <span className="text-base font-bold leading-5 text-[#2F8802] text-right">$1,448.00</span>
              </div>
            </div>

            <div className="flex items-start gap-2 justify-between">
              <div className="flex items-start gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M11.5884 2.54709C11.8038 2.45137 12.0446 2.43541 12.2685 2.49923L12.4004 2.54709L21.4007 6.54622C21.7546 6.70348 21.9818 7.04837 21.9941 7.42723L21.9885 7.5706L21.4161 12.7227C21.1249 15.3435 19.7003 17.6987 17.5285 19.174L17.241 19.3614L12.5244 22.3095C12.2407 22.4868 11.8902 22.509 11.5897 22.376L11.4644 22.3095L6.74777 19.3614C4.51178 17.9638 3.0061 15.6595 2.61709 13.063L2.57271 12.7227L2.00029 7.5706C1.95752 7.18564 2.14066 6.81546 2.46154 6.61369L2.58815 6.54622L11.5884 2.54709Z" stroke="black" strokeWidth="2"/>
                  <path d="M11.2276 15.7616L7.65617 12.8734L7.99902 12.5007L11.2276 15.0163L16.2276 8.58783L16.5705 8.9605L11.2276 15.7616Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-base font-medium leading-5 text-black">Umbrella(annual)</span>
              </div>
              <span className="text-base font-medium leading-5 text-black text-right">$1,234.00</span>
            </div>

            {/* Discounts */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <span className="text-base font-bold leading-5 text-black">Discounts</span>
              </div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 11.5L9.25 13L13 7" stroke="#2F8802" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="10" cy="10" r="7" stroke="#2F8802" strokeWidth="2"/>
                </svg>
                <span className="text-base font-medium leading-5 text-black flex-1">Paperless policy</span>
              </div>
            </div>

            <div className="h-px bg-[#D9D9D9]"></div>

            {/* Total */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <span className="text-2xl font-bold leading-8 text-black flex-1">Total</span>
                <span className="text-2xl font-bold leading-8 text-black text-right">$3,317.00</span>
              </div>
              <p className="text-sm font-medium leading-5 text-[#333]">
                This total cost includes all your selected insurance products. Note that policy periods might be different.
              </p>
            </div>

            <div className="h-px bg-[#D9D9D9]"></div>
          </div>
        </div>

        {/* Home Insurance Details */}
        <div className="rounded-lg border border-[#E6E6E6] p-5 md:p-6 flex flex-col gap-5 mb-6">
          <div className="flex flex-col gap-1 px-1">
            <h2 className="text-2xl font-bold leading-8 text-[#111827]">Home insurance details</h2>
            <p className="text-base font-medium leading-5 text-[#666]">12522 W Sunnyside Dr, El Mirage, AZ, 85335-6314</p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-start px-1">
              <span className="text-base font-bold leading-5 text-black">Carrier</span>
              <div className="w-[120px] h-[30px] bg-[#0A3066] flex items-center justify-center rounded">
                <span className="text-white font-bold text-sm">FOREMOST</span>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-start px-1">
                <span className="text-base font-bold leading-5 text-black">Policy Basics</span>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-start px-1 py-2">
                  <span className="text-base font-medium leading-5 text-black">Policy Start Date</span>
                  <span className="text-base font-medium leading-5 text-black">1/1/2026</span>
                </div>
                <div className="flex justify-between items-start px-1 py-2 bg-[#F2F2F2]">
                  <span className="text-base font-medium leading-5 text-black">Deductible</span>
                  <span className="text-base font-medium leading-5 text-black">$1,000</span>
                </div>
              </div>

              <div className="flex justify-between items-start px-1">
                <span className="text-base font-bold leading-5 text-black">Standard coverages</span>
                <span className="text-base font-bold leading-5 text-black text-right">Coverage Limit</span>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-start px-1 py-2 bg-[#F2F2F2]">
                  <span className="text-base font-medium leading-5 text-black">Dwelling</span>
                  <span className="text-base font-medium leading-5 text-black">$378,380</span>
                </div>
                <div className="flex justify-between items-start px-1 py-2">
                  <span className="text-base font-medium leading-5 text-black">Other structures</span>
                  <span className="text-base font-medium leading-5 text-black">$72,000</span>
                </div>
                <div className="flex justify-between items-start px-1 py-2 bg-[#F2F2F2]">
                  <span className="text-base font-medium leading-5 text-black">Personal property</span>
                  <span className="text-base font-medium leading-5 text-black">$138,000</span>
                </div>
                <div className="flex justify-between items-start px-1 py-2">
                  <span className="text-base font-medium leading-5 text-black">Loss of use</span>
                  <span className="text-base font-medium leading-5 text-black">$50,000</span>
                </div>
                <div className="flex justify-between items-start px-1 py-2 bg-[#F2F2F2]">
                  <span className="text-base font-medium leading-5 text-black">Personal liability</span>
                  <span className="text-base font-medium leading-5 text-black">$10,000</span>
                </div>
                <div className="flex justify-between items-start px-1 py-2">
                  <span className="text-base font-medium leading-5 text-black">Medical payment (to others)</span>
                  <span className="text-base font-medium leading-5 text-black">$5,000</span>
                </div>
              </div>

              <div className="px-1">
                <span className="text-base font-bold leading-5 text-black">Additional coverages</span>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-start px-1 py-2">
                  <span className="text-base font-medium leading-5 text-black">Water back-up</span>
                  <span className="text-base font-medium leading-5 text-black">$10,000</span>
                </div>
                <div className="flex justify-between items-start px-1 py-2">
                  <span className="text-base font-medium leading-5 text-black">Earthquake coverage</span>
                  <span className="text-base font-medium leading-5 text-[#666]">Not Included</span>
                </div>
                <div className="flex justify-between items-start px-1 py-2 bg-[#F2F2F2]">
                  <span className="text-base font-medium leading-5 text-black">Mold property damage</span>
                  <span className="text-base font-medium leading-5 text-[#666]">Not Included</span>
                </div>
                <div className="flex justify-between items-start px-1 py-2">
                  <span className="text-base font-medium leading-5 text-black">Mold liability</span>
                  <span className="text-base font-medium leading-5 text-[#666]">Not Included</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-[#D9D9D9]"></div>

            {/* Upload Declaration Page Section */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-bold leading-5 text-black">Compare with your current policy</h3>
              <p className="text-sm font-medium leading-5 text-[#666]">Upload your current policy's declaration page and we'll extract the data to show you a side-by-side comparison</p>

              <label className="border-2 border-dashed border-[#D9D9D9] rounded-lg p-6 flex flex-col items-center gap-3 cursor-pointer hover:bg-[#F9F9F9] transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2V14M2 12H22M7 7L12 2L17 7" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="text-center">
                  <p className="text-sm font-bold text-black">
                    {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs font-medium text-[#666] mt-1">PDF (Max 10MB)</p>
                </div>
              </label>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-6 gap-2">
                <div className="w-2 h-2 bg-[#156EEA] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-[#156EEA] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-[#156EEA] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                <span className="text-sm font-medium text-[#666] ml-2">Extracting policy data from PDF...</span>
              </div>
            )}

            {/* Error State */}
            {parseError && (
              <div className="flex items-start gap-3 p-4 bg-[#FFE5E5] border border-[#FFB3B3] rounded">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" stroke="#D32F2F" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="#D32F2F" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#D32F2F]">Error parsing PDF</p>
                  <p className="text-xs text-[#D32F2F] mt-1">{parseError}</p>
                </div>
              </div>
            )}

            {/* Success State */}
            {uploadedFile && extractedData && !parseError && (
              <div className="flex items-start gap-3 p-4 bg-[#E5F2F1] border border-[#A5D6A7] rounded">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" stroke="#2E7D32" strokeWidth="2"/>
                  <path d="M8 12L11 15L16 9" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#2E7D32]">Extracted ✅</p>
                  <p className="text-xs text-[#2E7D32] mt-1">Policy data extracted from {uploadedFile.name}. Read-only view below.</p>
                </div>
              </div>
            )}

            {/* Comparison Display */}
            {extractedData && (
              <div className="flex flex-col gap-4">
                <h3 className="text-base font-bold leading-5 text-black">Policy Comparison</h3>
                <div className="flex flex-col gap-3">
                  {/* Policy Basics Comparison */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-sm font-bold text-black">Policy Start Date</span>
                      <span className="text-xs font-medium text-[#666]">Presented vs Your Current</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#E5F1FF] p-2 rounded text-sm font-medium text-black text-center">1/1/2026</div>
                      <div className="bg-[#F2F2F2] p-2 rounded text-sm font-medium text-black text-center">{extractedData.policyStartDate || '—'}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-sm font-bold text-black">Deductible</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#E5F1FF] p-2 rounded text-sm font-medium text-black text-center">$1,000</div>
                      <div className={`p-2 rounded text-sm font-medium text-center ${extractedData.deductible && extractedData.deductible !== '$1,000' ? 'bg-[#FFE5E5] text-[#D32F2F]' : extractedData.deductible === '$1,000' ? 'bg-[#E5F2F1] text-[#2E7D32]' : 'bg-[#F2F2F2] text-[#999]'}`}>
                        {extractedData.deductible || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Coverage Comparison */}
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-sm font-bold text-black px-1">Standard Coverages</span>
                    {[
                      { label: 'Dwelling', presented: '$378,380', key: 'dwelling' },
                      { label: 'Other structures', presented: '$72,000', key: 'otherStructures' },
                      { label: 'Personal property', presented: '$138,000', key: 'personalProperty' },
                      { label: 'Loss of use', presented: '$50,000', key: 'lossOfUse' },
                      { label: 'Personal liability', presented: '$10,000', key: 'personalLiability' },
                      { label: 'Medical payment (to others)', presented: '$5,000', key: 'medicalPayment' },
                    ].map((item, idx) => (
                      <div key={item.key} className={`grid grid-cols-2 gap-2 px-1 py-1 ${idx % 2 === 0 ? 'bg-[#F9F9F9]' : ''}`}>
                        <div className="text-xs font-medium text-[#666]">{item.label}</div>
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-xs font-medium text-black text-center">{item.presented}</span>
                          <span className={`text-xs font-medium text-center rounded px-1 ${
                            extractedData[item.key] === item.presented
                              ? 'bg-[#E5F2F1] text-[#2E7D32]'
                              : extractedData[item.key]
                              ? 'bg-[#FFE5E5] text-[#D32F2F]'
                              : 'bg-[#F2F2F2] text-[#999]'
                          }`}>
                            {extractedData[item.key] || '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Additional Coverages Comparison */}
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-sm font-bold text-black px-1">Additional Coverages</span>
                    {[
                      { label: 'Water back-up', presented: '$10,000', key: 'waterBackup' },
                      { label: 'Earthquake coverage', presented: 'Not Included', key: 'earthquakeCoverage' },
                      { label: 'Mold property damage', presented: 'Not Included', key: 'moldPropertyDamage' },
                    ].map((item, idx) => (
                      <div key={item.key} className={`grid grid-cols-2 gap-2 px-1 py-1 ${idx % 2 === 0 ? 'bg-[#F9F9F9]' : ''}`}>
                        <div className="text-xs font-medium text-[#666]">{item.label}</div>
                        <div className="grid grid-cols-2 gap-2">
                          <span className="text-xs font-medium text-black text-center">{item.presented}</span>
                          <span className={`text-xs font-medium text-center rounded px-1 ${
                            extractedData[item.key] === item.presented
                              ? 'bg-[#E5F2F1] text-[#2E7D32]'
                              : extractedData[item.key]
                              ? 'bg-[#FFE5E5] text-[#D32F2F]'
                              : 'bg-[#F2F2F2] text-[#999]'
                          }`}>
                            {extractedData[item.key] || '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Premium Comparison */}
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-sm font-bold text-black">Annual Premium</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#E5F1FF] p-2 rounded text-sm font-medium text-black text-center">$2,083.00</div>
                      <div className={`p-2 rounded text-sm font-medium text-center ${extractedData.annualPremium && extractedData.annualPremium !== '$2,083.00' ? 'bg-[#FFE5E5] text-[#D32F2F]' : 'bg-[#E5F2F1] text-[#2E7D32]'}`}>
                        {extractedData.annualPremium || 'Not extracted'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="h-px bg-[#D9D9D9]"></div>

            <div className="flex items-start gap-1 justify-between">
              <span className="text-2xl font-bold leading-8 text-[#111827]">Yearly premium</span>
              <span className="text-2xl font-bold leading-8 text-[#111827]">$2,083.00</span>
            </div>
          </div>
        </div>

        {/* Umbrella Insurance Details */}
        <div className="rounded-lg border border-[#E6E6E6] p-5 md:p-6 flex flex-col gap-5 mb-6">
          <div className="flex flex-col gap-1 px-1">
            <h2 className="text-2xl font-bold leading-8 text-[#111827]">Umbrella insurance details</h2>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-start px-1">
              <span className="text-base font-bold leading-5 text-black">Carrier</span>
              <div className="w-[120px] h-[30px] bg-[#0A3066] flex items-center justify-center rounded">
                <span className="text-white font-bold text-sm">ALLSTATE</span>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-start px-1">
                <span className="text-base font-bold leading-5 text-black">Policy Basics</span>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-start px-1 py-2">
                  <span className="text-base font-medium leading-5 text-black">Policy Start Date</span>
                  <span className="text-base font-medium leading-5 text-black">1/1/2026</span>
                </div>
                <div className="flex justify-between items-start px-1 py-2 bg-[#F2F2F2]">
                  <span className="text-base font-medium leading-5 text-black">Deductible</span>
                  <span className="text-base font-medium leading-5 text-black">$0</span>
                </div>
              </div>

              <div className="flex justify-between items-start px-1">
                <span className="text-base font-bold leading-5 text-black">Coverages</span>
                <span className="text-base font-bold leading-5 text-black text-right">Coverage Limit</span>
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-start px-1 py-2 bg-[#F2F2F2]">
                  <span className="text-base font-medium leading-5 text-black flex-1">Extended replacement cost on content</span>
                  <span className="text-base font-medium leading-5 text-black">$1,245</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-[#D9D9D9]"></div>

            <div className="flex items-start gap-1 justify-between">
              <span className="text-2xl font-bold leading-8 text-[#111827]">Yearly premium</span>
              <span className="text-2xl font-bold leading-8 text-[#111827]">$1,234.00</span>
            </div>
          </div>
        </div>

        {/* Want to Save More */}
        <div className="rounded-lg bg-[#E8F8E8] p-6 md:p-10 flex flex-col md:flex-row items-start gap-6 mb-6">
          <div className="flex-1 flex flex-col gap-3">
            <h2 className="text-[28px] md:text-[32px] font-bold leading-[1.25] text-black">Want to save even more?</h2>
            <p className="text-lg md:text-xl font-medium leading-[1.4] text-black">
              Did you know you could save up to 20% when Matic shops your auto insurance, too? We work hard to find discounts – even checking to see if using two carriers gets better rates than bundling. Chat with a licensed advisor to get a free auto quote.
            </p>
            <button className="flex px-5 py-3 justify-center items-center gap-3 rounded bg-[#156EEA] text-white text-base font-bold leading-5 hover:bg-[#1257c7] transition-colors">
              Contact Your Advisor
            </button>
          </div>
        </div>

        {/* Why Customers Choose Matic */}
        <div className="rounded-lg bg-[#F1EBFF] p-6 md:p-10 flex flex-col md:flex-row items-start gap-10 mb-6">
          <div className="flex-1 flex flex-col gap-10">
            <h2 className="text-[28px] md:text-[32px] font-bold leading-[1.25] text-black">Why customers choose Matic</h2>
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold leading-7 text-black">Ongoing support</h3>
                <p className="text-base font-medium leading-5 text-black">
                  In addition to your carrier, Matic is an extra insurance advocate there to help you navigate issues with your policy.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold leading-7 text-black">Transparency</h3>
                <p className="text-base font-medium leading-5 text-black">
                  Our advisors are not paid based on your premium, so our motive is to find the best price and policy options for you.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold leading-7 text-black">Peace of mind</h3>
                <p className="text-base font-medium leading-5 text-black">
                  If your premium increases in the future, you can rely on Matic's network of 40+ A-rated carriers to help find a better option.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="rounded-lg bg-[#F2F2F2] p-6 md:p-10 flex flex-col gap-3">
          <p className="text-sm font-medium leading-5 text-[#333]">
            Quotes are estimates only. Quotes are subject to change without notice. Your actual rate, payment and coverage may be different. Quotes do not constitute a final offer of insurance, nor is any contract, agreement, or insurance coverage implied, formed or bound by the provision of this quote. Insurability, final insurance premium quotes and an offer of insurance is determined by the insurance company providing your insurance policy. *The coverages in this offer may differ from the coverages in your existing policy. Prior to accepting the offer, please review and ensure you are adequately covered in the event of a loss
          </p>
        </div>
      </div>

      {/* Select Offer - Sticky Bottom Bar */}
      <div className="sticky bottom-0 left-0 right-0 w-full flex flex-col md:flex-row items-start md:items-center gap-5 bg-white pt-4 md:pt-5 px-5 md:px-20 pb-5 border-t border-[#D9D9D9] z-40 shadow-lg">
        <p className="text-base font-medium leading-5 text-black flex-1">
          By clicking "Select Offer," you acknowledge that you have reviewed the details of your policy offer, including all coverage limits, deductibles, and premiums.
        </p>
        <button className="flex px-5 py-3 justify-center items-center gap-3 rounded bg-[#156EEA] text-white text-base font-bold leading-5 whitespace-nowrap hover:bg-[#1257c7] transition-colors">
          Select Offer
        </button>
      </div>
    </div>
  );
}
