import intersperse from "hornbeam-common/src/util/intersperse";

interface PlainTextViewProps {
  value: string;
}

export default function PlainTextView(props: PlainTextViewProps) {
  const {value} = props;
  let brIndex = 0;
  return value.split("\n\n").map((paragraph, paragraphIndex) => (
    <p key={paragraphIndex}>
      {intersperse(paragraph.split("\n"), <br key={brIndex++} />)}
    </p>
  ));
}
