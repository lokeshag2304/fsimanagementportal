from PIL import Image

def crop_transparent(image_path, output_path):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        width, height = img.size
        # Make the image perfectly square so the browser tab doesn't shrink it
        max_dim = max(width, height)
        # Add just a tiny bit of padding so it's not exactly touching the edges
        pad = int(max_dim * 0.05)
        new_size = max_dim + 2 * pad
        
        square_img = Image.new("RGBA", (new_size, new_size), (255, 255, 255, 0))
        paste_x = (new_size - width) // 2
        paste_y = (new_size - height) // 2
        square_img.paste(img, (paste_x, paste_y))
        
        # Save output
        square_img.save(output_path, "PNG")
        print(f"Successfully cropped and padded. New size: {new_size}x{new_size}")
    else:
        print("Image is entirely transparent.")

crop_transparent(
    "c:/xampp/htdocs/fsimanagementportal/public/tab-logo.png", 
    "c:/xampp/htdocs/fsimanagementportal/public/tab-logo.png"
)
