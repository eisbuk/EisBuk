import { getOrgFromLocation } from "../envInfo";

describe("Environment info", () => {
  test("should split on the first double dash and return the first part", async () => {
    expect(getOrgFromLocation("no-double-dashes.web.app")).toEqual(
      "no-double-dashes.web.app"
    );
    expect(getOrgFromLocation("one--double-dash-randomhash.web.app")).toEqual(
      "one.web.app"
    );
    expect(
      getOrgFromLocation("two--double--dashes-randomhash.web.app")
    ).toEqual("two.web.app");
  });
});
