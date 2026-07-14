import { eew, eewCancel } from "../eew";
import { eq } from "../eq";
import { updateStations } from "../../map/stations";
import type { EewPacket, EewCancelPacket, EqPacket, StnPacket } from "../wsTypes";

export type SourceMessage = EewPacket | EewCancelPacket | EqPacket | StnPacket;

export const dispatchMessage = (msg: SourceMessage): void => {
  if (msg.type === "eew") {
    eew(msg as EewPacket);
  } else if (msg.type === "eewCancel") {
    eewCancel(msg as EewCancelPacket);
  } else if (msg.type === "stn") {
    updateStations(msg as StnPacket);
  } else if (msg.type === "eq") {
    eq(msg as EqPacket);
  }
};
