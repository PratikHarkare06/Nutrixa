import { ClockIcon, LogoIcon, ProfileIcon } from "./icons";

type AppHeaderProps = {
  onNavigate: (nextPath: string) => void;
};

export const AppHeader = ({ onNavigate }: AppHeaderProps) => (
  <header className="h-[146px] border-b border-[#202c45] bg-[#191f2b] px-[48px]">
    <div className="mx-auto flex h-full max-w-[880px] items-center justify-between">
      <div className="flex items-center gap-[14px]">
        <LogoIcon className="h-[49px] w-[49px]" />
        <span className="text-[33px] font-[700] leading-none tracking-[-0.04em] text-[#f4f6fb]">
          NutriVision
        </span>
      </div>
      <div className="flex items-center gap-[42px] text-[#96a4bf]">
        <ClockIcon className="h-[40px] w-[40px]" />
        <button className="text-inherit" type="button" onClick={() => onNavigate("/profile")}>
          <ProfileIcon className="h-[40px] w-[40px]" />
        </button>
      </div>
    </div>
  </header>
);
