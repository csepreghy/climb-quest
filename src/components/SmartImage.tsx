import { useState, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { ChalkBagLoader } from "./ChalkBagLoader";

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  /** Loader chalk-bag size in px while image is decoding. */
  loaderSize?: number;
  /** Class for the wrapper element (positions the loader+image). */
  wrapperClassName?: string;
}

/** <img> that shows a bouncing chalk-bag loader until it finishes loading. */
export function SmartImage({ loaderSize = 48, wrapperClassName, className, onLoad, onError, ...rest }: Props) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={cn("relative", wrapperClassName)}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <ChalkBagLoader size={loaderSize} />
        </div>
      )}
      <img
        {...rest}
        loading={rest.loading ?? "lazy"}
        decoding={rest.decoding ?? "async"}
        className={cn(className, "transition-opacity duration-200", loaded ? "opacity-100" : "opacity-0")}
        onLoad={(e) => { setLoaded(true); onLoad?.(e); }}
        onError={(e) => { setLoaded(true); onError?.(e); }}
      />
    </div>
  );
}
