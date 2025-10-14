import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FaceDetector from 'expo-face-detector';

let faceDetectionReady = false;

/**
 * Initialize face detection system
 */
export async function initializeTensorFlow(): Promise<boolean> {
  try {
    if (faceDetectionReady) {
      return true;
    }

    console.log('Initializing native face detection system...');
    faceDetectionReady = true;
    console.log('Native face detection ready');
    
    return true;
  } catch (error) {
    console.error('Error initializing face detection:', error);
    return false;
  }
}

/**
 * Generate perceptual hash from grayscale image data
 * This creates a unique fingerprint of the face image
 */
function generatePerceptualHash(imageData: Uint8Array, width: number, height: number): number[] {
  const hashSize = 16; // 16x16 hash
  const blockWidth = Math.floor(width / hashSize);
  const blockHeight = Math.floor(height / hashSize);
  
  const hash: number[] = [];
  
  // Divide image into blocks and calculate average brightness
  for (let y = 0; y < hashSize; y++) {
    for (let x = 0; x < hashSize; x++) {
      let sum = 0;
      let count = 0;
      
      // Calculate average brightness of this block
      for (let by = 0; by < blockHeight; by++) {
        for (let bx = 0; bx < blockWidth; bx++) {
          const px = x * blockWidth + bx;
          const py = y * blockHeight + by;
          const idx = (py * width + px) * 4; // RGBA
          
          if (idx + 2 < imageData.length) {
            // Convert to grayscale
            const r = imageData[idx];
            const g = imageData[idx + 1];
            const b = imageData[idx + 2];
            const gray = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
            sum += gray;
            count++;
          }
        }
      }
      
      hash.push(count > 0 ? sum / count : 0);
    }
  }
  
  return hash;
}

/**
 * Extract facial features from detected face
 */
function extractFacialFeatures(face: FaceDetector.FaceFeature): number[] {
  const features: number[] = [];
  
  // Normalize positions relative to face bounds
  const faceWidth = face.bounds.size.width;
  const faceHeight = face.bounds.size.height;
  const faceX = face.bounds.origin.x;
  const faceY = face.bounds.origin.y;
  
  // Eye positions (relative to face)
  if (face.leftEyePosition) {
    features.push((face.leftEyePosition.x - faceX) / faceWidth);
    features.push((face.leftEyePosition.y - faceY) / faceHeight);
  } else {
    features.push(0, 0);
  }
  
  if (face.rightEyePosition) {
    features.push((face.rightEyePosition.x - faceX) / faceWidth);
    features.push((face.rightEyePosition.y - faceY) / faceHeight);
  } else {
    features.push(0, 0);
  }
  
  // Distance between eyes (facial width indicator)
  if (face.leftEyePosition && face.rightEyePosition) {
    const eyeDistance = Math.sqrt(
      Math.pow(face.rightEyePosition.x - face.leftEyePosition.x, 2) +
      Math.pow(face.rightEyePosition.y - face.leftEyePosition.y, 2)
    );
    features.push(eyeDistance / faceWidth);
  } else {
    features.push(0);
  }
  
  // Nose position
  if (face.noseBasePosition) {
    features.push((face.noseBasePosition.x - faceX) / faceWidth);
    features.push((face.noseBasePosition.y - faceY) / faceHeight);
  } else {
    features.push(0, 0);
  }
  
  // Mouth positions
  if (face.leftMouthPosition) {
    features.push((face.leftMouthPosition.x - faceX) / faceWidth);
    features.push((face.leftMouthPosition.y - faceY) / faceHeight);
  } else {
    features.push(0, 0);
  }
  
  if (face.rightMouthPosition) {
    features.push((face.rightMouthPosition.x - faceX) / faceWidth);
    features.push((face.rightMouthPosition.y - faceY) / faceHeight);
  } else {
    features.push(0, 0);
  }
  
  if (face.bottomMouthPosition) {
    features.push((face.bottomMouthPosition.x - faceX) / faceWidth);
    features.push((face.bottomMouthPosition.y - faceY) / faceHeight);
  } else {
    features.push(0, 0);
  }
  
  // Face proportions
  features.push(faceWidth / faceHeight); // Aspect ratio
  
  // Face angles
  features.push((face.rollAngle || 0) / 180); // Normalize to -1 to 1
  features.push((face.yawAngle || 0) / 180);
  
  // Eye states
  features.push(face.smilingProbability || 0);
  features.push(face.leftEyeOpenProbability || 0);
  features.push(face.rightEyeOpenProbability || 0);
  
  return features;
}

/**
 * Generate face encoding from image using native face detection + perceptual hashing
 */
async function generateFaceEncodingFromImage(imageUri: string): Promise<{
  encoding: number[];
  landmarks: number[];
} | null> {
  try {
    console.log('Generating face encoding from image...');
    
    // Step 1: Detect face with native API
    console.log('Running native face detection...');
    const detectionResult = await FaceDetector.detectFacesAsync(imageUri, {
      mode: FaceDetector.FaceDetectorMode.accurate,
      detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
      runClassifications: FaceDetector.FaceDetectorClassifications.all,
    });
    
    if (detectionResult.faces.length === 0) {
      console.log('No face detected');
      return null;
    }
    
    if (detectionResult.faces.length > 1) {
      console.log('Multiple faces detected');
      return null;
    }
    
    const face = detectionResult.faces[0];
    console.log('Face detected with bounds:', face.bounds);
    
    // Extract facial landmark features
    const landmarkFeatures = extractFacialFeatures(face);
    console.log('Extracted', landmarkFeatures.length, 'landmark features');
    
    // Step 2: Crop face region
    const { origin, size } = face.bounds;
    const padding = Math.max(20, size.width * 0.2); // 20% padding
    
    const cropRegion = {
      originX: Math.max(0, origin.x - padding),
      originY: Math.max(0, origin.y - padding),
      width: size.width + (padding * 2),
      height: size.height + (padding * 2),
    };
    
    console.log('Cropping and resizing face...');
    const processed = await manipulateAsync(
      imageUri,
      [
        { crop: cropRegion },
        { resize: { width: 64, height: 64 } } // Small size for fast processing
      ],
      { compress: 0.8, format: SaveFormat.JPEG }
    );
    
    // Step 3: Read the processed image
    const base64 = await FileSystem.readAsStringAsync(processed.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    console.log('Generating perceptual hash...');
    
    // Decode base64 to bytes
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Decode JPEG to get pixel data
    const jpeg = require('jpeg-js');
    const imageData = jpeg.decode(bytes, { useTArray: true });
    
    // Generate perceptual hash from image
    const perceptualHash = generatePerceptualHash(
      imageData.data,
      imageData.width,
      imageData.height
    );
    
    console.log('Perceptual hash generated:', perceptualHash.length, 'values');
    
    // Combine perceptual hash with landmark features
    const combinedEncoding = [...perceptualHash, ...landmarkFeatures];
    
    // Pad to 512 features
    while (combinedEncoding.length < 512) {
      combinedEncoding.push(0);
    }
    
    console.log('Final encoding:', combinedEncoding.length, 'features');
    
    return {
      encoding: combinedEncoding.slice(0, 512),
      landmarks: landmarkFeatures
    };
  } catch (error) {
    console.error('Error generating face encoding:', error);
    return null;
  }
}

// Helper for base64 decoding
function atob(base64: string): string {
  return Buffer.from(base64, 'base64').toString('binary');
}

/**
 * Detect faces in an image and return face encodings
 * Uses native face detection + perceptual hashing for unique face identification
 */
export async function detectFaces(imageUri: string): Promise<{
  success: boolean;
  faces: number;
  faceEncoding?: number[];
  confidence?: number;
  error?: string;
}> {
  try {
    console.log('detectFaces called');
    
    if (!faceDetectionReady) {
      await initializeTensorFlow();
    }

    // Validate image exists
    const imageInfo = await FileSystem.getInfoAsync(imageUri);
    if (!imageInfo.exists) {
      return { success: false, faces: 0, error: 'Image file not found' };
    }

    if (imageInfo.size < 1000) {
      return { success: false, faces: 0, error: 'Image too small' };
    }

    // Run native face detection
    console.log('Running native face detection...');
    const detectionResult = await FaceDetector.detectFacesAsync(imageUri, {
      mode: FaceDetector.FaceDetectorMode.accurate,
      detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
      runClassifications: FaceDetector.FaceDetectorClassifications.all,
    });
    
    console.log(`Found ${detectionResult.faces.length} face(s)`);
    
    if (detectionResult.faces.length === 0) {
      return { success: false, faces: 0, error: 'No face detected. Please position your face in the frame.' };
    }

    if (detectionResult.faces.length > 1) {
      return { 
        success: false, 
        faces: detectionResult.faces.length, 
        error: 'Multiple faces detected. Please ensure only one person is in frame.' 
      };
    }

    const face = detectionResult.faces[0];
    
    // Validate face size
    const faceSize = face.bounds.size.width * face.bounds.size.height;
    if (faceSize < 10000) {
      return { 
        success: false, 
        faces: 1, 
        error: 'Face too small. Please move closer to the camera.' 
      };
    }
    
    // Liveness check: eyes must be open
    const eyesOpen = 
      (face.leftEyeOpenProbability === undefined || face.leftEyeOpenProbability > 0.5) &&
      (face.rightEyeOpenProbability === undefined || face.rightEyeOpenProbability > 0.5);
    
    if (!eyesOpen) {
      return {
        success: false,
        faces: 1,
        error: 'Please keep your eyes open and look at the camera.'
      };
    }
    
    // Check if key landmarks are detected (ensures face is not covered)
    const landmarksDetected = [
      face.leftEyePosition,
      face.rightEyePosition,
      face.noseBasePosition,
    ].filter(Boolean).length;
    
    if (landmarksDetected < 3) {
      return {
        success: false,
        faces: 1,
        error: 'Face not clearly visible. Please remove any coverings (masks, sunglasses).'
      };
    }

    // Generate unique face encoding
    console.log('Generating unique face encoding...');
    const encodingResult = await generateFaceEncodingFromImage(imageUri);
    
    if (!encodingResult) {
      return { success: false, faces: 0, error: 'Failed to generate face encoding' };
    }

    console.log('Face encoding generated successfully');

    // Calculate confidence based on detected landmarks and classifications
    let confidence = 0.7;
    confidence += (landmarksDetected / 6) * 0.15; // Up to +0.15 for landmarks
    if (face.smilingProbability !== undefined) confidence += 0.05;
    if (face.leftEyeOpenProbability !== undefined) confidence += 0.05;
    if (face.rightEyeOpenProbability !== undefined) confidence += 0.05;

    return {
      success: true,
      faces: 1,
      faceEncoding: encodingResult.encoding,
      confidence: Math.min(confidence, 0.95),
    };
  } catch (error) {
    console.error('Error detecting faces:', error);
    return { 
      success: false, 
      faces: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Compare two face encodings and return similarity score
 * Uses combined perceptual hash + landmark comparison
 */
export function compareFaces(
  encoding1: number[],
  encoding2: number[]
): { match: boolean; similarity: number } {
  try {
    if (!encoding1 || !encoding2 || encoding1.length !== encoding2.length) {
      console.log('Invalid encodings for comparison');
      return { match: false, similarity: 0 };
    }

    console.log('Comparing face encodings...');
    
    // Split encoding into perceptual hash part and landmark part
    const hashSize = 256; // First 256 values are perceptual hash
    const hash1 = encoding1.slice(0, hashSize);
    const hash2 = encoding2.slice(0, hashSize);
    const landmarks1 = encoding1.slice(hashSize);
    const landmarks2 = encoding2.slice(hashSize);
    
    // Calculate hash similarity (more important - 70% weight)
    let hashDistance = 0;
    for (let i = 0; i < hash1.length; i++) {
      const diff = hash1[i] - hash2[i];
      hashDistance += diff * diff;
    }
    hashDistance = Math.sqrt(hashDistance);
    const maxHashDistance = Math.sqrt(hashSize);
    const hashSimilarity = 1 - (hashDistance / maxHashDistance);
    
    // Calculate landmark similarity (30% weight)
    let landmarkDistance = 0;
    for (let i = 0; i < landmarks1.length; i++) {
      const diff = landmarks1[i] - landmarks2[i];
      landmarkDistance += diff * diff;
    }
    landmarkDistance = Math.sqrt(landmarkDistance);
    const maxLandmarkDistance = Math.sqrt(landmarks1.length);
    const landmarkSimilarity = landmarks1.length > 0 
      ? 1 - (landmarkDistance / maxLandmarkDistance)
      : 1;
    
    // Combined similarity (weighted)
    const similarity = (hashSimilarity * 0.7) + (landmarkSimilarity * 0.3);
    
    console.log(`Similarity: ${(similarity * 100).toFixed(1)}% (hash: ${(hashSimilarity * 100).toFixed(1)}%, landmarks: ${(landmarkSimilarity * 100).toFixed(1)}%)`);
    
    // Strict threshold: 75% similarity required for match
    const threshold = 0.75;
    const match = similarity >= threshold;

    return { match, similarity };
  } catch (error) {
    console.error('Error comparing faces:', error);
    return { match: false, similarity: 0 };
  }
}

/**
 * Encode face data to string for storage
 */
export function encodeFaceData(faceEncoding: number[]): string {
  return JSON.stringify({
    encoding: faceEncoding,
    timestamp: Date.now(),
    version: '2.0',
  });
}

/**
 * Decode stored face data
 */
export function decodeFaceData(encodedData: string): number[] | null {
  try {
    const data = JSON.parse(encodedData);
    return data.encoding || null;
  } catch (error) {
    console.error('Error decoding face data:', error);
    return null;
  }
}
