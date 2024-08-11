import { Instant, LocalDateTime, convert } from "@js-joda/core";

interface InstantViewProps {
  value: Instant;
}

const formatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function InstantView(props: InstantViewProps) {
  const {value} = props;

  const jsDate = convert(LocalDateTime.ofInstant(value)).toDate();

  const parts = new Map(formatter.formatToParts(jsDate).map(part => [part.type, part.value]));

  return `${parts.get("weekday")} ${parts.get("day")} ${parts.get("month")} ${parts.get("year")} ${parts.get("hour")}:${parts.get("minute")}`;
}
