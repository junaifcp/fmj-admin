// src/components/recruiter/poster/PosterCanvas.tsx
import React from "react";
import type { TemplateId, PosterData } from "@/types/poster";

interface PosterCanvasProps {
  templateId: TemplateId;
  data: PosterData;
  size?: "preview" | "export";
}

const EXPORT_SIZE = { width: 1080, height: 1080 };
const PREVIEW_SIZE = { width: 360, height: 360 };

const PosterCanvas = React.forwardRef<HTMLDivElement, PosterCanvasProps>(
  ({ templateId, data, size = "preview" }, ref) => {
    const isExport = size === "export";
    const w = isExport ? EXPORT_SIZE.width : PREVIEW_SIZE.width;
    const h = isExport ? EXPORT_SIZE.height : PREVIEW_SIZE.height;

    const containerStyle: React.CSSProperties = {
      width: `${w}px`,
      height: `${h}px`,
      fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial`,
      lineHeight: 1.15,
      boxSizing: "border-box",
      display: "block",
    };

    // Templates with background images and all required elements
    const renderTemplate = () => {
      switch (templateId) {
        case "A": {
          return (
            <div
              style={{
                ...containerStyle,
                backgroundImage: data.backgroundImage
                  ? `linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95)), url(${data.backgroundImage})`
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                padding: isExport ? 60 : 20,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              {/* Header with logo and company info */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: isExport ? 32 : 14,
                      fontWeight: 900,
                      color: "#7C3AED",
                      letterSpacing: "0.05em",
                      marginBottom: 16,
                    }}
                  >
                    WE'RE HIRING
                  </div>
                  <h1
                    style={{
                      fontSize: isExport ? 72 : 28,
                      lineHeight: 1.1,
                      fontWeight: 900,
                      color: "#0f172a",
                      marginBottom: 24,
                      maxWidth: data.logoUrl ? "70%" : "100%",
                    }}
                  >
                    {data.title}
                  </h1>
                </div>
                {/* {data.logoUrl && (
                  <div
                    style={{
                      width: isExport ? 140 : 56,
                      height: isExport ? 140 : 56,
                      borderRadius: 20,
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                      padding: 12,
                    }}
                  >
                    <img
                      src={data.logoUrl}
                      alt={`${data.companyName} logo`}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                      crossOrigin="anonymous"
                    />
                  </div>
                )} */}
              </div>

              {/* Qualifications */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: isExport ? 16 : 8,
                  marginTop: 32,
                }}
              >
                {data.qualifications.slice(0, 4).map((q, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 16,
                      alignItems: "center",
                      background: "rgba(255,255,255,0.8)",
                      padding: isExport ? "16px 24px" : "8px 12px",
                      borderRadius: 12,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div
                      style={{
                        width: isExport ? 14 : 6,
                        height: isExport ? 14 : 6,
                        borderRadius: "50%",
                        background: "#7C3AED",
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        fontSize: isExport ? 28 : 12,
                        color: "#374151",
                        fontWeight: 600,
                      }}
                    >
                      {q}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer with company info and CTA */}
              <div
                style={{
                  marginTop: 32,
                  background: "rgba(255,255,255,0.95)",
                  padding: isExport ? 32 : 16,
                  borderRadius: 20,
                  boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 24,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: isExport ? 42 : 18,
                        fontWeight: 900,
                        color: "#111827",
                        marginBottom: 8,
                      }}
                    >
                      {data.companyName}
                    </div>
                    {data.location && (
                      <div
                        style={{
                          fontSize: isExport ? 24 : 11,
                          color: "#6b7280",
                          marginBottom: 4,
                        }}
                      >
                        📍 {data.location}
                      </div>
                    )}
                    {data.website && (
                      <div
                        style={{
                          fontSize: isExport ? 22 : 10,
                          color: "#7C3AED",
                          fontWeight: 600,
                        }}
                      >
                        🌐 {data.website}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                      color: "#fff",
                      padding: isExport ? "20px 40px" : "10px 20px",
                      borderRadius: 12,
                      fontSize: isExport ? 32 : 14,
                      fontWeight: 900,
                      whiteSpace: "nowrap",
                      boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                    }}
                  >
                    Apply Now
                  </div>
                </div>
              </div>
            </div>
          );
        }

        case "B": {
          return (
            <div
              style={{
                ...containerStyle,
                backgroundImage: data.backgroundImage
                  ? `linear-gradient(rgba(124,58,237,0.85), rgba(236,72,153,0.85)), url(${data.backgroundImage})`
                  : "linear-gradient(135deg,#7C3AED,#EC4899)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                color: "#fff",
                padding: isExport ? 60 : 20,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              {/* Logo */}
              {/* {data.logoUrl && (
                <div
                  style={{
                    width: isExport ? 140 : 56,
                    height: isExport ? 140 : 56,
                    borderRadius: "50%",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 12,
                    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                  }}
                >
                  <img
                    src={data.logoUrl}
                    alt={`${data.companyName} logo`}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
              )} */}

              {/* Main content */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: data.logoUrl ? 32 : 0,
                }}
              >
                <div
                  style={{
                    fontSize: isExport ? 28 : 12,
                    fontWeight: 800,
                    background: "rgba(255,255,255,0.15)",
                    padding: "12px 28px",
                    borderRadius: 999,
                    marginBottom: 24,
                    whiteSpace: "nowrap",
                  }}
                >
                  WE'RE HIRING
                </div>
                <h1
                  style={{
                    fontSize: isExport ? 76 : 28,
                    fontWeight: 900,
                    lineHeight: 1.1,
                    marginBottom: 16,
                  }}
                >
                  {data.title}
                </h1>
                <div
                  style={{
                    fontSize: isExport ? 36 : 16,
                    fontWeight: 900,
                    marginBottom: 8,
                  }}
                >
                  {data.companyName}
                </div>
                {data.location && (
                  <div
                    style={{
                      fontSize: isExport ? 24 : 11,
                      opacity: 0.9,
                    }}
                  >
                    📍 {data.location}
                  </div>
                )}

                {/* Qualifications */}
                <div
                  style={{
                    marginTop: 40,
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    justifyContent: "center",
                    maxWidth: "90%",
                  }}
                >
                  {data.qualifications.slice(0, 5).map((q, i) => (
                    <div
                      key={i}
                      style={{
                        padding: isExport ? "14px 24px" : "8px 14px",
                        borderRadius: 24,
                        background: "rgba(255,255,255,0.2)",
                        fontWeight: 700,
                        fontSize: isExport ? 22 : 10,
                        backdropFilter: "blur(10px)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {q}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{ width: "100%", marginTop: 32 }}>
                <div
                  style={{
                    background: "#fff",
                    color: "#7C3AED",
                    padding: isExport ? "24px 48px" : "12px 24px",
                    borderRadius: 16,
                    fontSize: isExport ? 36 : 16,
                    fontWeight: 900,
                    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                    marginBottom: 16,
                  }}
                >
                  Apply Now
                </div>
                {data.website && (
                  <div
                    style={{
                      fontSize: isExport ? 22 : 10,
                      opacity: 0.9,
                      fontWeight: 600,
                    }}
                  >
                    🌐 {data.website}
                  </div>
                )}
              </div>
            </div>
          );
        }

        case "C": {
          return (
            <div
              style={{
                ...containerStyle,
                backgroundImage: data.backgroundImage
                  ? `linear-gradient(rgba(248,250,252,0.95), rgba(248,250,252,0.95)), url(${data.backgroundImage})`
                  : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                padding: isExport ? 60 : 20,
              }}
            >
              <div
                style={{
                  background: "#fff",
                  padding: isExport ? 50 : 18,
                  borderRadius: 28,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    textAlign: "center",
                    borderBottom: "2px solid #eef2ff",
                    paddingBottom: 24,
                  }}
                >
                  {/* {data.logoUrl && (
                    <div
                      style={{
                        width: isExport ? 100 : 40,
                        height: isExport ? 100 : 40,
                        margin: "0 auto 16px",
                        background: "#eef2ff",
                        borderRadius: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 8,
                      }}
                    >
                      <img
                        src={data.logoUrl}
                        alt={`${data.companyName} logo`}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                        }}
                        crossOrigin="anonymous"
                      />
                    </div>
                  )} */}
                  <div
                    style={{
                      display: "inline-block",
                      padding: "10px 24px",
                      background: "#eef2ff",
                      borderRadius: 999,
                      fontWeight: 800,
                      color: "#7C3AED",
                      fontSize: isExport ? 24 : 11,
                      marginBottom: 16,
                      whiteSpace: "nowrap",
                    }}
                  >
                    WE'RE HIRING
                  </div>
                  <h1
                    style={{
                      fontSize: isExport ? 64 : 24,
                      fontWeight: 900,
                      color: "#0f172a",
                      marginBottom: 12,
                      lineHeight: 1.1,
                    }}
                  >
                    {data.title}
                  </h1>
                  <div
                    style={{
                      fontSize: isExport ? 32 : 14,
                      fontWeight: 800,
                      color: "#374151",
                    }}
                  >
                    {data.companyName}
                  </div>
                  {data.location && (
                    <div
                      style={{
                        fontSize: isExport ? 22 : 10,
                        color: "#6b7280",
                        marginTop: 8,
                      }}
                    >
                      📍 {data.location}
                    </div>
                  )}
                </div>

                {/* Qualifications */}
                <div style={{ flex: 1, marginTop: 32 }}>
                  <div
                    style={{
                      fontSize: isExport ? 28 : 13,
                      fontWeight: 800,
                      color: "#374151",
                      marginBottom: 20,
                    }}
                  >
                    Requirements:
                  </div>
                  {data.qualifications.slice(0, 4).map((q, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        gap: 16,
                        alignItems: "center",
                        marginBottom: 16,
                        background: "#f8fafc",
                        padding: isExport ? "16px 20px" : "8px 12px",
                        borderRadius: 12,
                      }}
                    >
                      <div
                        style={{
                          width: isExport ? 48 : 20,
                          height: isExport ? 48 : 20,
                          borderRadius: 10,
                          background:
                            "linear-gradient(135deg, #7C3AED, #EC4899)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 900,
                          fontSize: isExport ? 24 : 11,
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div
                        style={{
                          fontSize: isExport ? 24 : 11,
                          color: "#374151",
                          fontWeight: 600,
                          flex: 1,
                        }}
                      >
                        {q}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div
                  style={{
                    borderTop: "2px solid #eef2ff",
                    paddingTop: 24,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 20,
                  }}
                >
                  <div>
                    {data.website && (
                      <div
                        style={{
                          fontSize: isExport ? 20 : 9,
                          color: "#7C3AED",
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        🌐 {data.website}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                      color: "#fff",
                      padding: isExport ? "18px 36px" : "10px 18px",
                      borderRadius: 12,
                      fontSize: isExport ? 28 : 12,
                      fontWeight: 900,
                      whiteSpace: "nowrap",
                      boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
                    }}
                  >
                    Apply Now
                  </div>
                </div>
              </div>
            </div>
          );
        }

        case "D": {
          return (
            <div
              style={{
                ...containerStyle,
                backgroundImage: data.backgroundImage
                  ? `linear-gradient(rgba(15,23,42,0.92), rgba(15,23,42,0.92)), url(${data.backgroundImage})`
                  : "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                flexDirection: "column",
                padding: isExport ? 60 : 20,
                color: "#fff",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 32,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "10px 24px",
                      background: "rgba(124,58,237,0.2)",
                      borderRadius: 999,
                      fontWeight: 800,
                      fontSize: isExport ? 24 : 11,
                      marginBottom: 16,
                      border: "2px solid rgba(124,58,237,0.5)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <p>WE'RE HIRING</p>
                  </div>
                  <h1
                    style={{
                      fontSize: isExport ? 72 : 28,
                      fontWeight: 900,
                      lineHeight: 1.1,
                      marginBottom: 16,
                    }}
                  >
                    {data.title}
                  </h1>
                  <div
                    style={{
                      fontSize: isExport ? 36 : 16,
                      fontWeight: 800,
                      color: "#e2e8f0",
                      marginBottom: 8,
                    }}
                  >
                    {data.companyName}
                  </div>
                  {data.location && (
                    <div
                      style={{
                        fontSize: isExport ? 24 : 11,
                        color: "#94a3b8",
                      }}
                    >
                      📍 {data.location}
                    </div>
                  )}
                </div>
                {/* {data.logoUrl && (
                  <div
                    style={{
                      width: isExport ? 140 : 56,
                      height: isExport ? 140 : 56,
                      borderRadius: 20,
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 12,
                      boxShadow: "0 10px 40px rgba(124,58,237,0.5)",
                    }}
                  >
                    <img
                      src={data.logoUrl}
                      alt={`${data.companyName} logo`}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                      crossOrigin="anonymous"
                    />
                  </div>
                )} */}
              </div>

              {/* Qualifications */}
              <div
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(20px)",
                  borderRadius: 24,
                  padding: isExport ? 40 : 16,
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{
                    fontSize: isExport ? 28 : 13,
                    fontWeight: 800,
                    marginBottom: 20,
                    color: "#e2e8f0",
                  }}
                >
                  Key Requirements:
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: isExport ? 14 : 8,
                  }}
                >
                  {data.qualifications.slice(0, 4).map((q, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 16,
                        alignItems: "center",
                        background: "rgba(124,58,237,0.15)",
                        padding: isExport ? "16px 20px" : "8px 12px",
                        borderRadius: 12,
                        border: "1px solid rgba(124,58,237,0.3)",
                      }}
                    >
                      <div
                        style={{
                          width: isExport ? 12 : 6,
                          height: isExport ? 12 : 6,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #7C3AED, #EC4899)",
                          flexShrink: 0,
                          boxShadow: "0 0 20px rgba(124,58,237,0.6)",
                        }}
                      />
                      <div
                        style={{
                          fontSize: isExport ? 24 : 11,
                          fontWeight: 600,
                          color: "#e2e8f0",
                          flex: 1,
                        }}
                      >
                        {q}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer CTA */}
              <div
                style={{
                  marginTop: 32,
                  background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                  padding: isExport ? 36 : 16,
                  borderRadius: 20,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "0 10px 40px rgba(124,58,237,0.5)",
                }}
              >
                <div>
                  {data.website && (
                    <div
                      style={{
                        fontSize: isExport ? 22 : 10,
                        marginBottom: 4,
                        fontWeight: 600,
                      }}
                    >
                      🌐 {data.website}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: isExport ? 20 : 9,
                      opacity: 0.9,
                    }}
                  >
                    Join our team today
                  </div>
                </div>
                <div
                  style={{
                    background: "#fff",
                    color: "#7C3AED",
                    padding: isExport ? "20px 40px" : "10px 20px",
                    borderRadius: 12,
                    fontSize: isExport ? 32 : 14,
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                    boxShadow: "0 4px 20px rgba(255,255,255,0.3)",
                  }}
                >
                  Apply Now
                </div>
              </div>
            </div>
          );
        }

        default:
          return null;
      }
    };

    return (
      <div
        ref={ref}
        style={{
          width: `${w}px`,
          height: `${h}px`,
          overflow: "hidden",
          borderRadius: 12,
          display: "inline-block",
          background: "#fff",
        }}
      >
        {renderTemplate()}
      </div>
    );
  }
);

PosterCanvas.displayName = "PosterCanvas";
export default PosterCanvas;
