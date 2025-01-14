import { Typography } from "@mui/material";

export function Tooltip() {
  return (
    <Typography
      id="tooltip"
      style={{
        position: "absolute",
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: "5px",
        padding: "5px",
        fontSize: "12px",
        visibility: "hidden",
        textAlign: "left",
        zIndex: 9999,
      }}
    />
  );
}
