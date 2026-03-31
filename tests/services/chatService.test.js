const chatService = require("../../src/services/chatService");

describe("chatService", () => {
  it("should expose generateReply function", () => {
    expect(typeof chatService.generateReply).toBe("function");
  });
});
