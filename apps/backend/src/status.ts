import type { z } from "zod";
import type { GetStatusResponse } from "./generated/base/base";

export type Status = z.infer<typeof GetStatusResponse>;

export function getStatus(): Status {
  return {
    health: true,
    versions: ["v1"],
  };
}
