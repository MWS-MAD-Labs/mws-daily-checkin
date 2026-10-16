const { centralHeaders } = require("../../src/utils/centralHeaders");

describe("centralHeaders", () => {
  const original = process.env.CENTRAL_ORGANIZATION_ID;
  afterEach(() => {
    if (original === undefined) delete process.env.CENTRAL_ORGANIZATION_ID;
    else process.env.CENTRAL_ORGANIZATION_ID = original;
  });

  it("sends only the token when the .env has no Organization ID", () => {
    delete process.env.CENTRAL_ORGANIZATION_ID;
    expect(centralHeaders("mws_a.b")).toEqual({ Authorization: "Bearer mws_a.b" });
  });

  it("sends the Organization ID with the token, so Central can check it", () => {
    process.env.CENTRAL_ORGANIZATION_ID = " org_daily_aaaaaaaaaaaaaaaaaaaa ";
    expect(centralHeaders("mws_a.b")).toEqual({
      Authorization: "Bearer mws_a.b",
      "X-Central-Organization-Id": "org_daily_aaaaaaaaaaaaaaaaaaaa",
    });
  });
});
