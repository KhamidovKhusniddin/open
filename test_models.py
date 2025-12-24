import google.generativeai as genai
import os

GEMINI_API_KEY = "AIzaSyCghJJzCK_e53x3-XT2y7Tb0vWYumyN_rc"
genai.configure(api_key=GEMINI_API_KEY)

print("Listing models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error: {e}")
