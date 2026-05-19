import usdpLogo from "@/assets/opaq-logo.svg";

const AltisLogo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <img
    src={usdpLogo}
    alt="UCARD"
    width={size}
    height={size}
    className={className}
    style={{ width: size, height: size, objectFit: 'contain' }}
  />
);

export default AltisLogo;
