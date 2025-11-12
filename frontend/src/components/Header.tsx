import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <img src="/logo.svg" alt="Sealed Ballot" className="logo" />
        <div className="header-info">
          <h1 className="header-title">Sealed Ballot</h1>
          <p className="header-subtitle">🔒 Private Voting with FHE</p>
        </div>
      </div>
      <div className="header-right">
        <ConnectButton />
      </div>
    </header>
  );
}

