import React from 'react';

interface ScanQrIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const ScanQrIcon: React.FC<ScanQrIconProps> = ({ size = 20, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-current"
    {...props}
  >
    {/* Scanner corner frame */}
    <path
      d="M3 7V5a2 2 0 0 1 2-2h2M3 17v2a2 2 0 0 0 2 2h2M21 7V5a2 2 0 0 0-2-2h-2M21 17v2a2 2 0 0 1-2 2h-2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* QR-style inner dots */}
    <rect x="8" y="8" width="3" height="3" rx="1" fill="currentColor" />
    <rect x="13" y="8" width="3" height="3" rx="1" fill="currentColor" />
    <rect x="8" y="13" width="3" height="3" rx="1" fill="currentColor" />
    <rect x="13" y="13" width="3" height="3" rx="1" fill="currentColor" />
  </svg>
);

export default ScanQrIcon;
