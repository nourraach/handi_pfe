"use client";

interface TopBarProps {
  email: string;
  phone: string;
}

export function TopBar({ email, phone }: TopBarProps) {
  return (
    <div className="w-full bg-gradient-to-r from-purple-900 via-purple-800 to-purple-600">
      <div className="max-w-[1280px] mx-auto px-6 py-3">
        <div className="flex items-center justify-end gap-6 text-sm">
          <a
            href={`mailto:${email}`}
            className="text-white/90 hover:text-white transition-colors duration-200 flex items-center gap-2"
            aria-label={`Email us at ${email}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="hidden sm:inline">{email}</span>
          </a>
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="text-white/90 hover:text-white transition-colors duration-200 flex items-center gap-2"
            aria-label={`Call us at ${phone}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span className="hidden sm:inline">{phone}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
