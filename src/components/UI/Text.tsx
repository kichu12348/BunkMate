import { Text as RNText, TextProps as RNTextProps } from "react-native";

interface TextProps extends RNTextProps {
  children: React.ReactNode;
  style?: RNTextProps["style"];
}

const Text: React.FC<TextProps> = ({ children, style, ...props }) => {
  return (
    <RNText style={[style, { fontFamily: "Inter" }]} {...props}>
      {children}
    </RNText>
  );
};

export default Text;
