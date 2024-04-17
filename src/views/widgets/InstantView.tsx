import { DateTimeFormatter, Instant, LocalDateTime } from "@js-joda/core";
import { Locale }  from "@js-joda/locale_en";

interface InstantViewProps {
  value: Instant;
}

const formatter = DateTimeFormatter
  .ofPattern("EE dd MMM yyyy HH:mm")
  .withLocale(Locale.UK);

export default function InstantView(props: InstantViewProps) {
  const {value} = props;

  return LocalDateTime.ofInstant(value).format(formatter);
}
