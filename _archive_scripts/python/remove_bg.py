from PIL import Image

def remove_white_bg(image_path, output_path):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    datas = img.getdata()
    
    newData = []
    # A generous threshold for white color to catch artifacts from JPEG compression
    for item in datas:
        # white background threshold
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0)) # fully transparent
        else:
            # Maybe apply a slight anti-aliasing or simply keep original?
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")

remove_white_bg(
    "c:/xampp/htdocs/fsimanagementportal/public/tab-logo.jpg", 
    "c:/xampp/htdocs/fsimanagementportal/public/tab-logo.png"
)
