export interface FileUploaderProps {
  readonly onFileLoaded: (content: string) => void;
  readonly formattedOutput: string;
  readonly disabled?: boolean;
  readonly className?: string;
}
