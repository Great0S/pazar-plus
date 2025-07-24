import logger from "../../utils/logger";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "../../utils/cn";
// Use Lucide React icons instead of Heroicons to avoid import issues
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastVariants = {
  success: {
    container:
      "toast-success border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20",
    icon: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-100 dark:bg-green-900/30",
  },
  error: {
    container:
      "toast-error border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20",
    icon: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/30",
  },
  warning: {
    container:
      "toast-warning border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20",
    icon: "text-yellow-600 dark:text-yellow-400",
    iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  info: {
    container:
      "toast-info border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20",
    icon: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
  },
};

export const Toast = ({
  id,
  title,
  message,
  variant = "info",
  duration = 5000,
  onClose,
  className,
  showProgress = true,
  position = "top-right",
  stackIndex = 0,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef(null);
  const progressRef = useRef(null);
  const toastRef = useRef(null);

  // Ensure valid variant and duration
  const validVariants = ["success", "error", "warning", "info"];
  const safeVariant = validVariants.includes(variant) ? variant : "info";
  const safeDuration =
    typeof duration === "number" && duration >= 0 ? duration : 5000;
  const safeMessage = message || "Notification"; // Fallback message

  const Icon = toastIcons[safeVariant] || toastIcons.info; // Fallback to info icon
  const variantStyles = toastVariants[safeVariant] || toastVariants.info; // Fallback to info styles
  const CloseIcon = X;

  const handleClose = useCallback(() => {
    if (isLeaving) return; // Prevent multiple close calls
    setIsLeaving(true);
    setTimeout(() => {
      try {
        onClose?.(id);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Error in toast onClose callback:", error);
        }
      }
    }, 300); // Match exit animation duration
  }, [id, onClose, isLeaving]);

  // Animation and auto-hide logic
  useEffect(() => {
    // Debug logging (only in development)
    if (process.env.NODE_ENV === "development") {
      logger.info("🍞 Toast mounted:", {
        id,
        title,
        message: safeMessage,
        variant: safeVariant,
      });
    }

    // Entrance animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto-hide timer
    if (safeDuration > 0) {
      timerRef.current = setTimeout(() => {
        handleClose();
      }, safeDuration);

      // Progress bar animation - optimized with requestAnimationFrame
      if (showProgress) {
        const startTime = Date.now();
        const updateProgress = () => {
          const elapsed = Date.now() - startTime;
          const newProgress = Math.max(0, 100 - (elapsed / safeDuration) * 100);

          setProgress(newProgress);

          if (newProgress > 0 && elapsed < safeDuration) {
            progressRef.current = requestAnimationFrame(updateProgress);
          }
        };
        progressRef.current = requestAnimationFrame(updateProgress);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) cancelAnimationFrame(progressRef.current);
      if (process.env.NODE_ENV === "development") {
        logger.info("🍞 Toast unmounted:", id);
      }
    };
  }, [
    safeDuration,
    showProgress,
    handleClose,
    id,
    title,
    safeMessage,
    safeVariant,
  ]);

  // Pause on hover - optimized
  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) cancelAnimationFrame(progressRef.current);
  };

  const handleMouseLeave = () => {
    if (safeDuration > 0 && progress > 0) {
      const remainingTime = (progress / 100) * safeDuration;
      timerRef.current = setTimeout(() => {
        handleClose();
      }, remainingTime);

      if (showProgress) {
        const startTime = Date.now();
        const initialProgress = progress;
        const updateProgress = () => {
          const elapsed = Date.now() - startTime;
          const newProgress = Math.max(
            0,
            initialProgress - (elapsed / remainingTime) * initialProgress
          );

          setProgress(newProgress);

          if (newProgress > 0 && elapsed < remainingTime) {
            progressRef.current = requestAnimationFrame(updateProgress);
          }
        };
        progressRef.current = requestAnimationFrame(updateProgress);
      }
    }
  };

  // Keyboard navigation
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      handleClose();
    }
  };

  // Enhanced animation classes with position-aware animations
  const getAnimationClass = () => {
    const isRightPosition = position.includes("right");
    const isLeftPosition = position.includes("left");
    const isTopPosition = position.includes("top");
    const isBottomPosition = position.includes("bottom");

    if (isLeaving) {
      if (isRightPosition) return "animate-slide-out-to-right";
      if (isLeftPosition) return "animate-slide-out-to-left";
      if (isTopPosition && !isRightPosition && !isLeftPosition)
        return "animate-slide-out-to-top";
      if (isBottomPosition && !isRightPosition && !isLeftPosition)
        return "animate-slide-out-to-bottom";
      return "animate-slide-out-to-right"; // Default
    }

    if (isVisible) {
      if (isRightPosition) return "animate-slide-in-from-right";
      if (isLeftPosition) return "animate-slide-in-from-left";
      if (isTopPosition && !isRightPosition && !isLeftPosition)
        return "animate-slide-in-from-top";
      if (isBottomPosition && !isRightPosition && !isLeftPosition)
        return "animate-slide-in-from-bottom";
      return "animate-slide-in-from-right"; // Default
    }

    return "opacity-0 translate-x-full";
  };

  return (
    <div
      ref={toastRef}
      className={cn(
        // Base toast styles with better spacing
        "toast flex items-start p-4 rounded-lg shadow-lg border max-w-sm w-80",
        "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
        "transition-all duration-300 ease-in-out",
        "focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        // Ensure proper z-index management
        "relative z-toast",
        variantStyles.container,
        getAnimationClass(),
        className
      )}
      role="alert"
      aria-live={safeVariant === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      aria-describedby={title ? `toast-title-${id}` : undefined}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        // Simplified positioning - let container handle z-index
        position: "relative",
        opacity: isVisible && !isLeaving ? 1 : 0,
        transform:
          isVisible && !isLeaving ? "translateX(0)" : "translateX(100%)",
        // Add animation delay based on stack position
        animationDelay: `${stackIndex * 50}ms`,
      }}
      {...props}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3",
          variantStyles.iconBg
        )}
      >
        <Icon
          className={cn("h-5 w-5", variantStyles.icon)}
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <div
            id={`toast-title-${id}`}
            className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1"
          >
            {title}
          </div>
        )}
        <div
          className="text-sm text-gray-600 dark:text-gray-400 leading-5"
          role="status"
          aria-live="polite"
        >
          {safeMessage}
        </div>
      </div>

      {/* Close Button */}
      <button
        type="button"
        className="ml-3 flex-shrink-0 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
        onClick={handleClose}
        aria-label="Close notification"
      >
        <CloseIcon className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* Progress Bar */}
      {showProgress && safeDuration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-100 ease-linear",
              safeVariant === "success" && "bg-green-500",
              safeVariant === "error" && "bg-red-500",
              safeVariant === "warning" && "bg-yellow-500",
              safeVariant === "info" && "bg-blue-500"
            )}
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Time remaining"
          />
        </div>
      )}
    </div>
  );
};

export default Toast;
