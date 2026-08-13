/**
 * Before/after unit cases for Priority #1 face pipeline math.
 * Run: npx --yes tsx src/lib/facePipelineMath.test.ts
 */
import assert from "node:assert/strict";
import {
  chooseUploadStrategy,
  computeFaceRatio,
  computePaddedCrop,
  dimensionsLookMismatched,
  isFaceLargeEnough,
  isValidCropRect,
} from "./facePipelineMath";

function section(title: string) {
  console.log(`\n=== ${title} ===`);
}

section("BEFORE vs AFTER: landscape buffer face-size gate");

{
  // Android front camera buffer often landscape even in portrait UI.
  const imageW = 1920;
  const imageH = 1080;
  // Face that fills much of the short side / oval, but is modest vs long side.
  const bounds = { left: 860, top: 340, width: 140, height: 180 };

  const oldRatio = bounds.width / imageW; // buggy: long side
  const newRatio = computeFaceRatio(bounds, imageW, imageH);

  console.log("old faceRatio (width/longSide):", oldRatio.toFixed(4));
  console.log("new faceRatio (span/shortSide):", newRatio.toFixed(4));

  // BEFORE: false reject as too_small
  assert.equal(oldRatio < 0.08, true, "before: should illustrate false reject");
  // AFTER: accept
  assert.equal(isFaceLargeEnough(newRatio), true, "after: face should pass");
  console.log("PASS — too_small false-reject fixed");
}

section("BEFORE vs AFTER: EXIF dimension swap → unsafe crop");

{
  const claimedW = 1080; // what takePictureAsync often reports (display-oriented)
  const claimedH = 1920;
  const bitmapW = 1920; // actual JPEG pixels before bake
  const bitmapH = 1080;

  assert.equal(
    dimensionsLookMismatched(claimedW, claimedH, bitmapW, bitmapH),
    true
  );

  // Old pipeline cropped using claimed portrait dims + buffer-space bounds → garbage.
  const bounds = { left: 700, top: 200, width: 400, height: 480 };
  const unsafeOnClaimed = computePaddedCrop(bounds, claimedW, claimedH);
  // Crop math using wrong canvas can still produce a rect — but strategy must refuse it.
  const decision = chooseUploadStrategy({
    claimedWidth: claimedW,
    claimedHeight: claimedH,
    bitmapWidth: bitmapW,
    bitmapHeight: bitmapH,
    bounds,
    faceRatio: computeFaceRatio(bounds, bitmapW, bitmapH),
  });

  assert.equal(decision.strategy, "full_frame");
  assert.equal(decision.crop, null);
  console.log(
    "unsafe claimed crop exists?:",
    Boolean(unsafeOnClaimed),
    "→ strategy:",
    decision.strategy
  );
  console.log("PASS — EXIF mismatch forces full_frame (no bad crop to InsightFace)");
}

section("AFTER: aligned dims allow padded crop");

{
  const w = 1080;
  const h = 1920;
  const bounds = { left: 290, top: 520, width: 500, height: 620 };
  const faceRatio = computeFaceRatio(bounds, w, h);
  const decision = chooseUploadStrategy({
    claimedWidth: w,
    claimedHeight: h,
    bitmapWidth: w,
    bitmapHeight: h,
    bounds,
    faceRatio,
  });

  assert.equal(decision.strategy, "padded_crop");
  assert.ok(decision.crop);
  assert.equal(isValidCropRect(decision.crop!, w, h), true);
  console.log("crop:", decision.crop);
  console.log("PASS — healthy frontal capture uses padded_crop");
}

section("AFTER: out-of-bounds ML Kit frame → full_frame fallback");

{
  const w = 1080;
  const h = 1920;
  const bounds = { left: 2000, top: 50, width: 200, height: 240 };
  const crop = computePaddedCrop(bounds, w, h);
  assert.equal(crop, null);

  const decision = chooseUploadStrategy({
    claimedWidth: w,
    claimedHeight: h,
    bitmapWidth: w,
    bitmapHeight: h,
    bounds,
    faceRatio: 0.2,
  });
  assert.equal(decision.strategy, "full_frame");
  console.log("PASS — invalid bounds never produce a crop");
}

section("AFTER: small-but-valid face prefers full_frame context");

{
  const w = 1920;
  const h = 1080;
  const bounds = { left: 900, top: 400, width: 100, height: 120 };
  const faceRatio = computeFaceRatio(bounds, w, h);
  assert.equal(isFaceLargeEnough(faceRatio), true);

  const decision = chooseUploadStrategy({
    claimedWidth: w,
    claimedHeight: h,
    bitmapWidth: w,
    bitmapHeight: h,
    bounds,
    faceRatio,
  });
  assert.equal(decision.strategy, "full_frame");
  console.log("faceRatio:", faceRatio.toFixed(4), "→", decision.strategy);
  console.log("PASS — marginal faces keep full-frame context for buffalo_sc");
}

console.log("\nAll Priority #1 before/after pipeline math cases passed.\n");
