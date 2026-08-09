import os
from PIL import Image

logo_path = "/Users/vaibhavpatel/work/public/wikwik-logo.png"
output_dir = "/Users/vaibhavpatel/Desktop/PlayStoreAssets"
os.makedirs(output_dir, exist_ok=True)

try:
    # 1. App Icon (512x512)
    img = Image.open(logo_path)
    icon = img.resize((512, 512), Image.Resampling.LANCZOS)
    icon.save(os.path.join(output_dir, "app_icon_512x512.png"))

    # 2. Feature Graphic (1024x500)
    # White background
    bg_color = (255, 255, 255)
    feature_graphic = Image.new('RGB', (1024, 500), color=bg_color)
    
    # Resize logo to fit in center (400x400)
    logo_resized = img.resize((400, 400), Image.Resampling.LANCZOS)
    offset = ((1024 - 400) // 2, (500 - 400) // 2)
    
    # Paste logo handling transparency
    if logo_resized.mode in ('RGBA', 'LA') or (logo_resized.mode == 'P' and 'transparency' in logo_resized.info):
        feature_graphic.paste(logo_resized, offset, logo_resized)
    else:
        feature_graphic.paste(logo_resized, offset)
        
    feature_graphic.save(os.path.join(output_dir, "feature_graphic_1024x500.png"))
    
    print("Successfully generated Play Store assets on Desktop!")
except Exception as e:
    print(f"Error: {e}")
