export default function InfoHint({ text }: { text: string }) {
  return (
    <span className="info-hint" tabIndex={0} aria-label={text}>
      <span className="info-hint__icon" aria-hidden="true">
        i
      </span>
      <span className="info-hint__tooltip" role="tooltip">
        {text}
      </span>
    </span>
  );
}
