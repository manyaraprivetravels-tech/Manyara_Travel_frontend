

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneCall, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import api from "../api/axios";

export default function FloatingContact() {
  const [open, setOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Reference to the complete floating contact component
  const contactRef = useRef(null);

  useEffect(() => {
    api
      .get("/settings")
      .then((res) => {
        setWhatsappNumber(res.data?.whatsapp_number || "");
      })
      .catch(() => {
        setWhatsappNumber("");
      });
  }, []);

  // Close contact options when clicking anywhere outside the component
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        open &&
        contactRef.current &&
        !contactRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  // Close when pressing Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Remove spaces, +, -, brackets, etc.
  const cleanNumber = whatsappNumber.replace(/\D/g, "");

  const whatsappMessage =
    "Hello Manyara Prive Vacations, I would like to know more about your travel packages.";

  const whatsappUrl = cleanNumber
    ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
        whatsappMessage
      )}`
    : "#";

  const phoneUrl = cleanNumber ? `tel:+${cleanNumber}` : "#";

  const disabled = !cleanNumber;

  return (
    <div
      ref={contactRef}
      className="fixed right-4 bottom-12 sm:right-6 sm:bottom-25 z-[60]"
    >
      {/* Contact Options */}
      <div
        className={`absolute right-0 bottom-20 sm:bottom-[74px]
          flex flex-col items-end gap-3
          transition-all duration-300 ease-out
          ${
            open
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-4 scale-95 pointer-events-none"
          }`}
      >
        {/* WhatsApp */}
        <a
          href={disabled ? undefined : whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact Manyara Prive Vacations Holidays on WhatsApp"
          className={`flex items-center gap-3
            bg-white text-navy
            border border-navy/10
            rounded-full
            pl-4 pr-2 py-2
            shadow-lg
            hover:shadow-xl
            transition-all duration-200
            whitespace-nowrap
            ${
              disabled
                ? "opacity-50 pointer-events-none"
                : "hover:-translate-y-0.5"
            }`}
        >
          <span className="text-sm font-semibold">WhatsApp</span>

          <span
            className="w-11 h-11 rounded-full
              bg-[#25D366] text-white
              flex items-center justify-center
              shrink-0"
          >
            <FaWhatsapp className="w-6 h-6" />
          </span>
        </a>

        {/* Call Us */}
        <a
          href={disabled ? undefined : phoneUrl}
          aria-label="Call Manyara Prive Vacations Holidays"
          className={`flex items-center gap-3
            bg-white text-navy
            border border-navy/10
            rounded-full
            pl-4 pr-2 py-2
            shadow-lg
            hover:shadow-xl
            transition-all duration-200
            whitespace-nowrap
            ${
              disabled
                ? "opacity-50 pointer-events-none"
                : "hover:-translate-y-0.5"
            }`}
        >
          <span className="text-sm font-semibold">Call Us</span>

          <span
            className="w-11 h-11 rounded-full
              bg-navy text-white
              flex items-center justify-center
              shrink-0"
          >
            <Phone className="w-5 h-5" />
          </span>
        </a>
      </div>

      {/* Main Floating Contact Button */}
      <div className="relative">
        {/* Outer ringing waves */}
        {!open && (
          <>
            <span
              className="absolute inset-0
                rounded-full
                border-2 border-accent/40
                animate-ping"
            />

            <span
              className="absolute -inset-1
                rounded-full
                border border-accent/20
                animate-pulse"
            />
          </>
        )}

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={
            open ? "Close contact options" : "Open contact options"
          }
          aria-expanded={open}
          className={`relative
            w-14 h-14
            sm:w-16 sm:h-16
            rounded-full
            bg-accent
            text-white
            shadow-xl
            flex items-center justify-center
            hover:bg-accent-hover
            hover:scale-105
            active:scale-95
            transition-all duration-200
            ${
              !open
                ? "animate-[wiggle_1.8s_ease-in-out_infinite]"
                : ""
            }`}
        >
          {open ? (
            <X className="w-6 h-6 sm:w-7 sm:h-7" />
          ) : (
            <PhoneCall className="w-6 h-6 sm:w-7 sm:h-7" />
          )}
        </button>
      </div>
    </div>
  );
}


