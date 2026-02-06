import { expect } from "chai";
import { ethers } from "hardhat";

describe("Sum", function () {
  it("should return the sum of a + b", async function () {
    const Sum = await ethers.getContractFactory("Sum");
    const sum = await Sum.deploy();

    expect(await sum.add(2, 3)).to.equal(5);
    expect(await sum.add(0, 0)).to.equal(0);
    expect(await sum.add(100, 200)).to.equal(300);
  });
});
