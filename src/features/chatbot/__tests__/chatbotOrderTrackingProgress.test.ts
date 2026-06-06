import {
  resolveMaterialOrderTrackingProgress,
  resolveSupplierOrderTrackingProgress,
} from "@/features/chatbot/chatbotOrderTrackingProgress";

describe("chatbotOrderTrackingProgress", () => {
  it("maps supplier statuses to progress percent", () => {
    expect(resolveSupplierOrderTrackingProgress("sent")).toEqual({
      percent: 45,
      cancelled: false,
    });
    expect(resolveSupplierOrderTrackingProgress("delivered")).toEqual({
      percent: 100,
      cancelled: false,
    });
    expect(resolveSupplierOrderTrackingProgress("cancelled")).toEqual({
      percent: 0,
      cancelled: true,
    });
  });

  it("maps material order statuses to progress percent", () => {
    expect(resolveMaterialOrderTrackingProgress("pending")).toEqual({
      percent: 25,
      cancelled: false,
    });
    expect(resolveMaterialOrderTrackingProgress("ordered")).toEqual({
      percent: 60,
      cancelled: false,
    });
    expect(resolveMaterialOrderTrackingProgress("received")).toEqual({
      percent: 100,
      cancelled: false,
    });
    expect(resolveMaterialOrderTrackingProgress("cancelled")).toEqual({
      percent: 0,
      cancelled: true,
    });
  });
});
