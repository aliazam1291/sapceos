import { describe, expect, it } from "vitest";
import { glTier } from "@/lib/perf";
import { planetFrag, planetLook } from "@/components/space/planetShader";

/*
 * The two decisions behind "the space scroll on landing is not smooth"
 * (2026-10-24), pinned so a later edit cannot quietly undo them.
 */

describe("glTier: which quality level a GPU starts at", () => {
  it("treats a missing context and the software rasterisers as software", () => {
    expect(glTier(null)).toBe("software");
    expect(glTier("ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)")).toBe("software");
    expect(glTier("llvmpipe (LLVM 15.0.7, 256 bits)")).toBe("software");
  });

  it("recognises integrated Intel graphics (they start at low)", () => {
    expect(glTier("ANGLE (Intel, Intel(R) UHD Graphics (0x00004628) Direct3D11 vs_5_0 ps_5_0, D3D11)")).toBe("integrated");
    expect(glTier("ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)")).toBe("integrated");
  });

  it("leaves discrete cards alone, Intel Arc included", () => {
    expect(glTier("ANGLE (Intel, Intel(R) Arc(TM) A770 Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)")).toBe("discrete");
    expect(glTier("ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)")).toBe("discrete");
    expect(glTier("Apple M2")).toBe("discrete");
  });
});

describe("planet shader: cheap to compile", () => {
  it("compiles one kind per program, never all three behind a uniform", () => {
    expect(planetFrag).toMatch(/#if KIND == 0/);
    expect(planetFrag).toMatch(/#elif KIND == 1/);
    expect(planetFrag).not.toMatch(/uKind/);
  });

  it("keeps the fBm loop a real loop (a bound the compiler cannot see)", () => {
    // A constant bound lets the D3D compiler unroll every call site: 10-13 s
    // per program on an Intel UHD.
    expect(planetFrag).not.toMatch(/for \(int i = 0; i < \d+; i\+\+\)/);
  });

  it("bumps the relief from derivatives, not three more fBm taps", () => {
    expect(planetFrag).toMatch(/dFdx\(relief\)/);
    expect((planetFrag.match(/fbm\(/g) ?? []).length).toBeLessThanOrEqual(12);
  });
});

describe("red is heat", () => {
  it("makes exactly one world rust-red, a rocky one on the flight", () => {
    const red = planetLook("iocl-geortd", false);
    expect(red.kind).toBe(1);
    expect(red.land).toBe("#b4522f");
    expect(planetLook("vahan-shakti", false).land).not.toBe("#b4522f");
  });
});
