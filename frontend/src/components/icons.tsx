import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const createIcon = (paths: ReactNode, viewBox = "0 0 24 24") => (
  props: IconProps,
) => (
  <svg viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    {paths}
  </svg>
);

export const LogoIcon = createIcon(
  <>
    <rect x="2" y="2" width="20" height="20" rx="6" fill="#FF7A12" />
    <path
      d="M12 6.9C9.96 6.9 8.3 8.5 8.3 10.48C8.3 11.95 9.22 13.22 10.56 13.77V15.04H13.42V13.77C14.76 13.22 15.68 11.95 15.68 10.48C15.68 8.5 14.02 6.9 12 6.9ZM12 17.3C11.19 17.3 10.53 16.66 10.53 15.87H13.47C13.47 16.66 12.81 17.3 12 17.3Z"
      fill="#F8FAFF"
    />
    <path d="M12 8.7V10.86" stroke="#FF7A12" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="12" cy="12.76" r="0.92" fill="#FF7A12" />
  </>,
);

export const ClockIcon = createIcon(
  <>
    <path
      d="M12 7.5V12L15 13.8M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M7 2.7L5.2 4.5M17 2.7L18.8 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </>,
);

export const ProfileIcon = createIcon(
  <>
    <circle cx="12" cy="8.2" r="4.1" fill="currentColor" />
    <path
      d="M4.2 20.2C5.6 16.42 8.5 14.5 12 14.5C15.5 14.5 18.4 16.42 19.8 20.2"
      fill="currentColor"
    />
  </>,
);

export const HomeIcon = createIcon(
  <>
    <path
      d="M4.5 11.1L12 4.7L19.5 11.1V19.2C19.5 19.64 19.14 20 18.7 20H14.3V14.6H9.7V20H5.3C4.86 20 4.5 19.64 4.5 19.2V11.1Z"
      fill="currentColor"
    />
  </>,
);

export const UploadCloudIcon = createIcon(
  <>
    <path
      d="M8.6 18.2H17.5C20.54 18.2 23 15.81 23 12.85C23 10.2 21 8.02 18.42 7.61C17.5 4.84 14.84 3 11.8 3C8.12 3 5.14 5.77 4.85 9.24C2.65 10.15 1.2 12.22 1.2 14.54C1.2 16.58 2.37 18.2 4.5 18.2H8.6Z"
      fill="#00B140"
    />
    <path d="M12.1 15.9V9.1" stroke="#F8FAFF" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M8.9 12.3L12.1 9.1L15.3 12.3" stroke="#F8FAFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </>,
  "0 0 24 24",
);

export const ImagePlusIcon = createIcon(
  <>
    <path
      d="M4.5 5.5C4.5 4.95 4.95 4.5 5.5 4.5H14.5C15.05 4.5 15.5 4.95 15.5 5.5V14.5C15.5 15.05 15.05 15.5 14.5 15.5H5.5C4.95 15.5 4.5 15.05 4.5 14.5V5.5Z"
      fill="currentColor"
    />
    <path d="M7.1 12.6L9.6 10.1L12.9 13.4" stroke="#FF7A12" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11.3 11.4L12.5 10.2L14.2 11.9" stroke="#FF7A12" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.1 8.2H8.11" stroke="#FF7A12" strokeWidth="2.1" strokeLinecap="round" />
    <path d="M18.6 4.6V10.4M15.7 7.5H21.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </>,
);

export const ArrowRightIcon = createIcon(
  <path
    d="M5 12H18M18 12L12.8 6.8M18 12L12.8 17.2"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />,
);

export const SpinnerIcon = createIcon(
  <>
    <path
      d="M12 3C16.97 3 21 7.03 21 12"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path
      d="M12 21C7.03 21 3 16.97 3 12"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      opacity="0.28"
    />
  </>,
);

export const BreadcrumbChevronIcon = createIcon(
  <path
    d="M9 5L15.5 12L9 19"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  />,
);

export const CameraIcon = createIcon(
  <>
    <rect x="4" y="7" width="16" height="11.5" rx="2.2" fill="currentColor" />
    <path d="M8 7L9.4 4.9H14.6L16 7" fill="currentColor" />
    <circle cx="12" cy="12.7" r="3.2" fill="#191F2B" />
    <circle cx="12" cy="12.7" r="1.9" fill="currentColor" />
  </>,
);

export const HistoryIcon = createIcon(
  <>
    <path
      d="M5.4 7.2V3.8M5.4 7.2H8.9M5.4 7.2C7.08 4.97 9.72 3.6 12.6 3.6C17.57 3.6 21.6 7.63 21.6 12.6C21.6 17.57 17.57 21.6 12.6 21.6C8.4 21.6 4.87 18.72 3.88 14.82"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12.6 8.2V12.6L15.7 14.4" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
  </>,
);

export const HeartIcon = createIcon(
  <path
    d="M12 20.2C5.9 16.2 3.2 12.9 3.2 8.8C3.2 6.15 5.36 4 8.02 4C9.7 4 11.2 4.84 12 6.14C12.8 4.84 14.3 4 15.98 4C18.64 4 20.8 6.15 20.8 8.8C20.8 12.9 18.1 16.2 12 20.2Z"
    fill="currentColor"
  />,
);

export const ChartBarsIcon = createIcon(
  <>
    <rect x="4.2" y="10.5" width="3.2" height="8.8" rx="1.3" fill="currentColor" />
    <rect x="10.4" y="5.8" width="3.2" height="13.5" rx="1.3" fill="currentColor" />
    <rect x="16.6" y="8.1" width="3.2" height="11.2" rx="1.3" fill="currentColor" />
  </>,
);

export const OverviewIcon = createIcon(
  <>
    <circle cx="8" cy="8" r="3.3" fill="currentColor" />
    <circle cx="16" cy="8" r="3.3" fill="currentColor" opacity="0.84" />
    <circle cx="8" cy="16" r="3.3" fill="currentColor" opacity="0.72" />
    <circle cx="16" cy="16" r="3.3" fill="currentColor" opacity="0.58" />
  </>,
);

export const RulerIcon = createIcon(
  <>
    <rect x="3.5" y="7.5" width="17" height="9" rx="2.2" stroke="currentColor" strokeWidth="2" />
    <path d="M7 9.7V12.8M10 9.7V11.8M13 9.7V12.8M16 9.7V11.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </>,
);

export const ScaleIcon = createIcon(
  <>
    <path d="M6 18.8H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 8.2L7.4 10.4C6 11.08 5.1 12.5 5.1 14.06V16.4H18.9V14.06C18.9 12.5 18 11.08 16.6 10.4L12 8.2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M12 8.2V4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M10.2 12.7C10.7 11.75 11.53 11.2 12.5 11.2C13.47 11.2 14.3 11.75 14.8 12.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </>,
);

export const MacroChartIcon = createIcon(
  <>
    <path d="M12 12L12 3C16.97 3 21 7.03 21 12H12Z" fill="currentColor" />
    <path d="M12 12L4.2 16.5C2.45 13.47 2.73 9.72 4.92 6.99L12 12Z" fill="currentColor" opacity="0.78" />
    <path d="M12 12H21C21 16.97 16.97 21 12 21C8.85 21 5.95 19.38 4.31 16.72L12 12Z" fill="currentColor" opacity="0.56" />
  </>,
);

export const ShareIcon = createIcon(
  <>
    <circle cx="17.6" cy="5.4" r="2.4" fill="currentColor" />
    <circle cx="6.4" cy="12" r="2.4" fill="currentColor" />
    <circle cx="17.6" cy="18.6" r="2.4" fill="currentColor" />
    <path d="M8.5 11L15.2 6.7M8.5 13L15.2 17.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </>,
);

export const FileIcon = createIcon(
  <>
    <path d="M7 3.8H13.6L18.2 8.4V19.2C18.2 20.08 17.48 20.8 16.6 20.8H7C6.12 20.8 5.4 20.08 5.4 19.2V5.4C5.4 4.52 6.12 3.8 7 3.8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M13.6 3.8V8.4H18.2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </>,
);

export const TableIcon = createIcon(
  <>
    <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M4 9.7H20M9.3 5V19M14.7 5V19" stroke="currentColor" strokeWidth="2" />
  </>,
);

export const CodeBracketsIcon = createIcon(
  <>
    <path d="M9.2 7.2L4.4 12L9.2 16.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.8 7.2L19.6 12L14.8 16.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </>,
);

export const CopyIcon = createIcon(
  <>
    <rect x="8" y="4.2" width="10.6" height="13.6" rx="2.2" stroke="currentColor" strokeWidth="2" />
    <path d="M5.4 8.2H4.8C4.14 8.2 3.6 8.74 3.6 9.4V18.6C3.6 19.7 4.5 20.6 5.6 20.6H12.8C13.46 20.6 14 20.06 14 19.4V18.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </>,
);

export const InfoIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="8.8" stroke="currentColor" strokeWidth="2" />
    <path d="M12 10.2V15.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="7.3" r="1.2" fill="currentColor" />
  </>,
);

export const PlusIcon = createIcon(
  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />,
);

export const UserIcon = createIcon(
  <>
    <circle cx="12" cy="7.8" r="3.4" stroke="currentColor" strokeWidth="2" />
    <path d="M5.4 18.8C6.6 15.86 9 14.2 12 14.2C15 14.2 17.4 15.86 18.6 18.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </>,
);

export const SearchIcon = createIcon(
  <>
    <circle cx="10.5" cy="10.5" r="5.8" stroke="currentColor" strokeWidth="2.4" />
    <path d="M15 15L20 20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </>,
);

export const SlidersIcon = createIcon(
  <>
    <path d="M5 6H19M5 12H19M5 18H19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="9" cy="6" r="2" fill="currentColor" />
    <circle cx="15" cy="12" r="2" fill="currentColor" />
    <circle cx="11" cy="18" r="2" fill="currentColor" />
  </>,
);

export const CalendarIcon = createIcon(
  <>
    <rect x="4" y="5.8" width="16" height="14.2" rx="2.2" stroke="currentColor" strokeWidth="2" />
    <path d="M8 3.9V7.2M16 3.9V7.2M4 9.4H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </>,
);

export const BoltIcon = createIcon(
  <path
    d="M13.3 2.8L6.7 12H11.3L10.2 21.2L16.8 12H12.2L13.3 2.8Z"
    fill="currentColor"
  />,
);

export const ForkKnifeIcon = createIcon(
  <>
    <path d="M7.1 3.6V11.8M5.3 3.6V8.8M8.9 3.6V8.8M7.1 11.8V20.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M15.8 3.6V20.4M18.7 3.6V10.2C18.7 11.57 17.59 12.68 16.22 12.68H15.38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </>,
);

export const StatsIcon = createIcon(
  <>
    <rect x="5" y="8.2" width="3" height="9.8" rx="1.1" fill="currentColor" />
    <rect x="10.5" y="5.2" width="3" height="12.8" rx="1.1" fill="currentColor" />
    <rect x="16" y="11.2" width="3" height="6.8" rx="1.1" fill="currentColor" />
  </>,
);

export const SquareIcon = createIcon(
  <rect x="4" y="4" width="16" height="16" rx="2.2" stroke="currentColor" strokeWidth="2.2" />,
);

export const RotateCwIcon = createIcon(
  <>
    <path
      d="M18.5 9.2V4.8M18.5 4.8H14.1M18.5 4.8C16.85 3.14 14.57 2.1 12.05 2.1C7.02 2.1 2.95 6.17 2.95 11.2C2.95 16.23 7.02 20.3 12.05 20.3C16.3 20.3 19.85 17.39 20.86 13.45"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </>,
);

export const TrashIcon = createIcon(
  <>
    <path d="M5.8 7.2H18.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M9 7.2V5.6C9 4.72 9.72 4 10.6 4H13.4C14.28 4 15 4.72 15 5.6V7.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <rect x="7.2" y="7.2" width="9.6" height="12.4" rx="2" stroke="currentColor" strokeWidth="2.2" />
  </>,
);

export const EyeIcon = createIcon(
  <>
    <path
      d="M2.6 12C4.54 8.4 8.02 6 12 6C15.98 6 19.46 8.4 21.4 12C19.46 15.6 15.98 18 12 18C8.02 18 4.54 15.6 2.6 12Z"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2.6" fill="currentColor" />
  </>,
);

export const FireIcon = createIcon(
  <path
    d="M12.2 3.1C13.8 5.3 14.3 7.1 13.8 8.5C13.5 9.42 12.9 10.1 12 10.8C11.47 9.8 10.8 8.9 9.7 8.1C8.3 9.4 7.4 11.12 7.4 13.1C7.4 16.01 9.76 18.4 12.7 18.4C15.64 18.4 18 16.01 18 13.1C18 8.92 15.5 6 12.2 3.1Z"
    fill="currentColor"
  />,
);

export const TargetIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="7.8" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
  </>,
);

export const ChevronDownIcon = createIcon(
  <path
    d="M6 9L12 15L18 9"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  />,
);

export const InsightsSparkIcon = createIcon(
  <>
    <path
      d="M4.2 16.8L8.2 12.2L11.5 14.8L17.1 8.1"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="4.2" cy="16.8" r="1.8" fill="currentColor" />
    <circle cx="8.2" cy="12.2" r="1.8" fill="currentColor" />
    <circle cx="11.5" cy="14.8" r="1.8" fill="currentColor" />
    <circle cx="17.1" cy="8.1" r="1.8" fill="currentColor" />
    <path d="M6.4 4.4L7 6.1L8.7 6.7L7 7.3L6.4 9L5.8 7.3L4.1 6.7L5.8 6.1L6.4 4.4Z" fill="currentColor" />
    <path d="M13.8 3L14.25 4.25L15.5 4.7L14.25 5.15L13.8 6.4L13.35 5.15L12.1 4.7L13.35 4.25L13.8 3Z" fill="currentColor" />
  </>,
);

export const ProteinIcon = createIcon(
  <>
    <path
      d="M8.3 5.4C6.2 5.4 4.5 7.1 4.5 9.2C4.5 11.3 6.2 13 8.3 13H10.2L14.8 17.6C15.64 18.44 17 18.44 17.84 17.6C18.68 16.76 18.68 15.4 17.84 14.56L13.24 9.96V8.1C13.24 6.06 11.58 4.4 9.54 4.4H8.3V5.4Z"
      fill="currentColor"
    />
    <circle cx="8.2" cy="9.2" r="1.5" fill="#1A202C" />
  </>,
);

export const WaterIcon = createIcon(
  <path
    d="M12 3.4C12 3.4 6.5 9.26 6.5 13.1C6.5 16.14 8.96 18.6 12 18.6C15.04 18.6 17.5 16.14 17.5 13.1C17.5 9.26 12 3.4 12 3.4Z"
    fill="currentColor"
  />,
);

export const WarningIcon = createIcon(
  <>
    <path
      d="M12 4L20 18H4L12 4Z"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinejoin="round"
    />
    <path d="M12 9.2V13.1" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    <circle cx="12" cy="15.8" r="1.1" fill="currentColor" />
  </>,
);

export const TrendUpIcon = createIcon(
  <path
    d="M4.5 15.5L9.4 10.6L13 14.2L19.5 7.7M15.7 7.7H19.5V11.5"
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
  />,
);

export const CheckCircleIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="8.8" stroke="currentColor" strokeWidth="2.2" />
    <path d="M8 12.2L10.7 14.9L16.2 9.4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </>,
);

export const CloseIcon = createIcon(
  <path
    d="M7 7L17 17M17 7L7 17"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
  />,
);

export const CheckIcon = createIcon(
  <path
    d="M5.5 12.4L9.4 16.1L18.5 7.3"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  />,
);

export const SparklesIcon = createIcon(
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    stroke="currentColor"
    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
  />,
);
