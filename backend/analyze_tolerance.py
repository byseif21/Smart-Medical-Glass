
import os
import sys
import itertools
import argparse
from pathlib import Path
from typing import List, Dict, Tuple

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

def analyze_dataset(dataset_path: str):
    """
    Analyzes a dataset of faces to find optimal tolerance.
    Structure:
    dataset/
      ├── person1/
      │   ├── img1.jpg
      │   └── img2.jpg
      └── person2/
          ├── img1.jpg
          └── img2.jpg
    """
    try:
        import numpy as np
        import face_recognition as fr
        from services.face_service import get_face_service
        # We use the service just for its helper methods if needed, 
        # but here we use face_recognition directly for batch processing efficiency
    except ImportError:
        print("❌ Error: Missing required libraries (numpy, face_recognition).")
        print("Please install them first: pip install numpy face_recognition")
        return

    dataset = Path(dataset_path)
    if not dataset.exists():
        print(f"❌ Dataset path not found: {dataset_path}")
        return

    print(f"📂 Scanning dataset: {dataset_path}")
    
    # 1. Load all encodings
    # structure: { "person_name": [encoding1, encoding2, ...] }
    people_encodings: Dict[str, List[np.ndarray]] = {}
    
    total_images = 0
    for person_dir in dataset.iterdir():
        if person_dir.is_dir():
            name = person_dir.name
            people_encodings[name] = []
            
            for img_path in person_dir.glob("*"):
                if img_path.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                    try:
                        image = fr.load_image_file(str(img_path))
                        encodings = fr.face_encodings(image)
                        
                        if len(encodings) == 1:
                            people_encodings[name].append(encodings[0])
                            total_images += 1
                            print(f"  ✓ Loaded {name}/{img_path.name}")
                        else:
                            print(f"  ⚠ Skipped {name}/{img_path.name}: Found {len(encodings)} faces")
                    except Exception as e:
                        print(f"  ✗ Error loading {img_path.name}: {e}")

    if total_images < 2:
        print("\n❌ Not enough images to analyze. Need at least 2 images.")
        return

    print(f"\n📊 Analyzing {total_images} images from {len(people_encodings)} people...")

    # 2. Generate Pairs
    positive_distances = [] # Same person
    negative_distances = [] # Different people

    names = list(people_encodings.keys())

    # Calculate Positive Pairs (Same Person)
    for name, encodings in people_encodings.items():
        if len(encodings) < 2:
            continue
        # Compare every encoding with every other encoding of the same person
        for i in range(len(encodings)):
            for j in range(i + 1, len(encodings)):
                dist = fr.face_distance([encodings[i]], encodings[j])[0]
                positive_distances.append(dist)

    # Calculate Negative Pairs (Different People)
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            name_a = names[i]
            name_b = names[j]
            
            # Compare all faces of person A with all faces of person B
            for enc_a in people_encodings[name_a]:
                for enc_b in people_encodings[name_b]:
                    dist = fr.face_distance([enc_a], enc_b)[0]
                    negative_distances.append(dist)

    # 3. Statistics
    pos_avg = np.mean(positive_distances) if positive_distances else 0
    neg_avg = np.mean(negative_distances) if negative_distances else 0
    pos_std = np.std(positive_distances) if positive_distances else 0
    neg_std = np.std(negative_distances) if negative_distances else 0

    print("\n" + "="*50)
    print("📈 ANALYSIS RESULTS")
    print("="*50)
    
    print(f"\n🟢 Same Person Matches (True Positives): {len(positive_distances)} pairs")
    print(f"   Average Distance: {pos_avg:.4f} (Lower is better)")
    print(f"   Range: {np.min(positive_distances):.4f} - {np.max(positive_distances):.4f}")
    
    print(f"\n🔴 Different Person Mismatches (True Negatives): {len(negative_distances)} pairs")
    print(f"   Average Distance: {neg_avg:.4f} (Higher is better)")
    print(f"   Range: {np.min(negative_distances):.4f} - {np.max(negative_distances):.4f}")

    # 4. Suggest Optimal Tolerance
    # Simple heuristic: The midpoint between the averages, weighted by standard deviation
    # Or finding the point where overlap is minimized.
    
    print("\n⚖️  TOLERANCE SIMULATION")
    print("   (How many errors happen at different thresholds?)")
    print("-" * 60)
    print(f"{'Threshold':<10} | {'False Accept (Security Risk)':<30} | {'False Reject (Frustration)':<30}")
    print("-" * 60)

    best_accuracy = 0
    best_threshold = 0.6

    for t in range(30, 80, 5):
        threshold = t / 100.0
        
        # False Accept: Different people with distance < threshold
        false_accepts = sum(1 for d in negative_distances if d < threshold)
        far = (false_accepts / len(negative_distances)) * 100 if negative_distances else 0
        
        # False Reject: Same person with distance > threshold
        false_rejects = sum(1 for d in positive_distances if d > threshold)
        frr = (false_rejects / len(positive_distances)) * 100 if positive_distances else 0
        
        accuracy = 100 - (far + frr)
        if accuracy > best_accuracy:
            best_accuracy = accuracy
            best_threshold = threshold

        print(f"{threshold:<10} | {false_accepts:4d} pairs ({far:5.1f}%)           | {false_rejects:4d} pairs ({frr:5.1f}%)")

    print("-" * 60)
    print(f"\n✅ RECOMMENDED TOLERANCE: {best_threshold}")
    print(f"   Current System Setting: Check config.py (usually 0.6)")
    
    gap = np.min(negative_distances) - np.max(positive_distances)
    if gap > 0:
        print(f"\n🌟 PERFECT SEPARATION FOUND!")
        print(f"   Any tolerance between {np.max(positive_distances):.2f} and {np.min(negative_distances):.2f} will give 100% accuracy.")
    else:
        print(f"\n⚠️  Overlap Detected")
        print("   Some 'Same Person' photos are more different than 'Different People' photos.")
        print("   This is normal. Choose tolerance based on priority:")
        print("   - High Security? Choose lower (e.g., 0.50) -> More false rejects.")
        print("   - Convenience? Choose higher (e.g., 0.65) -> More false accepts.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        analyze_dataset(sys.argv[1])
    else:
        print("Usage: python analyze_tolerance.py <path_to_dataset_folder>")
        print("Example: python analyze_tolerance.py C:/images/dataset")
