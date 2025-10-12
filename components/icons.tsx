import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

const defaultProps: IconProps = {
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const FileUpIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps} {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

export const ClipboardPasteIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps} {...props}>
    <path d="M15 2H9a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
    <path d="M16 4h2a2 2 0 0 1 2 2v4" />
    <path d="M12 2v4" />
    <path d="M9 14h7" />
    <path d="M9 18h7" />
  </svg>
);

export const BotIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps} {...props}>
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

export const SlidersHorizontalIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps} {...props}>
    <line x1="21" x2="14" y1="4" y2="4" />
    <line x1="10" x2="3" y1="4" y2="4" />
    <line x1="21" x2="12" y1="12" y2="12" />
    <line x1="8" x2="3" y1="12" y2="12" />
    <line x1="21" x2="16" y1="20" y2="20" />
    <line x1="12" x2="3" y1="20" y2="20" />
    <line x1="14" x2="14" y1="2" y2="6" />
    <line x1="8" x2="8" y1="10" y2="14" />
    <line x1="16" x2="16" y1="18" y2="22" />
  </svg>
);

export const MicIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps} {...props}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps} {...props}>
    <path d="m12 3-1.9 1.9-1.1-3-1.1 3L6 6l3 1.1-3 1.1L6 9l1.9-1.9L9 12l1.1-3 1.1 3L12 9l-1.9-1.9L9 6l3-1.1ZM9 6l-1.9-1.9L6 6l1.1 3 1.9-1.9-1.1-3Z" />
    <path d="M18 13a6 6 0 0 1 6 6" />
    <path d="M21 15a3 3 0 1 1-6 0c0-1.7 1.3-3 3-3" />
    <path d="M12 21a6 6 0 0 1-6-6" />
    <path d="M3 15a3 3 0 1 0 6 0c0-1.7-1.3-3-3-3" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const FileTextIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps} {...props}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
    <line x1="10" x2="8" y1="9" y2="9" />
  </svg>
);

export const MessageSquareIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps} {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const CodeIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps} {...props}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

export const PercentIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps} {...props}>
    <line x1="19" x2="5" y1="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

export const PodcastIcon: React.FC<IconProps> = (props) => (
  <svg {...defaultProps} {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="2" />
    <path d="M8.5 17a.5.5 0 0 0 0-1" />
    <path d="M12 15a3 3 0 0 0 0-6" />
    <path d="M15.5 17a.5.5 0 0 0 0-1" />
  </svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = (props) => (
    <svg {...defaultProps} {...props}>
        <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
    </svg>
);

export const ChevronsUpDownIcon: React.FC<IconProps> = (props) => (
    <svg {...defaultProps} {...props}>
        <path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>
    </svg>
);

export const DownloadIcon: React.FC<IconProps> = (props) => (
    <svg {...defaultProps} {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
);

export const PlayIcon: React.FC<IconProps> = (props) => (
    <svg {...defaultProps} {...props}>
        <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
);

export const PencilIcon: React.FC<IconProps> = (props) => (
    <svg {...defaultProps} {...props}>
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        <path d="m15 5 4 4"/>
    </svg>
);

export const PauseIcon: React.FC<IconProps> = (props) => (
    <svg {...defaultProps} {...props}>
        <rect x="6" y="4" width="4" height="16" />
        <rect x="14" y="4" width="4" height="16" />
    </svg>
);

export const StopCircleIcon: React.FC<IconProps> = (props) => (
    <svg {...defaultProps} {...props}>
        <circle cx="12" cy="12" r="10" />
        <rect x="9" y="9" width="6" height="6" />
    </svg>
);

export const RewindIcon: React.FC<IconProps> = (props) => (
    <svg {...defaultProps} {...props}>
        <polygon points="11 19 2 12 11 5 11 19" />
        <polygon points="22 19 13 12 22 5 22 19" />
    </svg>
);

export const FastForwardIcon: React.FC<IconProps> = (props) => (
    <svg {...defaultProps} {...props}>
        <polygon points="13 19 22 12 13 5 13 19" />
        <polygon points="2 19 11 12 2 5 2 19" />
    </svg>
);

export const DownloadCloudIcon: React.FC<IconProps> = (props) => (
    <svg {...defaultProps} {...props}>
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
        <path d="M12 12v9" />
        <path d="m8 17 4 4 4-4" />
    </svg>
);
