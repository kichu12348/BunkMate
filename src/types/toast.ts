export interface ToastButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export interface ToastState {
  title?: string;
  message: string | null;
  isVisible: boolean;
  showToast: ({
    title,
    message,
    buttons,
    delay,
  }: {
    title?: string;
    message: string;
    buttons?: ToastButton[];
    delay?: number;
  }) => void;
  hideToast: () => void;
  buttons?: ToastButton[] | [];
}
