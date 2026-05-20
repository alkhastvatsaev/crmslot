const QRCode = {
  toDataURL: jest.fn().mockResolvedValue("data:image/png;base64,mock"),
  toString: jest.fn().mockResolvedValue("mock-svg"),
};

export default QRCode;
