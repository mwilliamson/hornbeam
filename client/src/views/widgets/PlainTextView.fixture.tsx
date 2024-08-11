import PlainTextView from "./PlainTextView";

export default {
  Empty: <PlainTextView value={""} />,
  SingleLine: <PlainTextView value={"Hello world"} />,
  TwoLines: <PlainTextView value={"Hello\nworld"} />,
  TwoParagraphs: <PlainTextView value={"Hello\n\nworld"} />,
};
