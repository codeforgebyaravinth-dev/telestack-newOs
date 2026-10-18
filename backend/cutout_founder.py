import os
from PIL import Image, ImageFilter
import numpy as np
from collections import deque

input_path = r"c:\Users\USER\Desktop\studio\signagex\frontend\public\studio\founder.jpg"
output_path = r"c:\Users\USER\Desktop\studio\signagex\frontend\public\studio\founder_nobg.png"

img = Image.open(input_path).convert("RGBA")
arr = np.array(img)
H, W, _ = arr.shape

# Maximum luminance per pixel (R, G, B)
lum = np.max(arr[:, :, :3], axis=2)

# Flood fill from the image borders to mark the outer background
# In founder.jpg, background is 0. Threshold allows for tiny JPEG artifacts (<= 4).
visited = np.zeros((H, W), dtype=bool)
queue = deque()

for x in range(W):
    if lum[0, x] <= 5 and not visited[0, x]:
        visited[0, x] = True
        queue.append((0, x))
    if lum[H-1, x] <= 5 and not visited[H-1, x]:
        visited[H-1, x] = True
        queue.append((H-1, x))

for y in range(H):
    if lum[y, 0] <= 5 and not visited[y, 0]:
        visited[y, 0] = True
        queue.append((y, 0))
    if lum[y, W-1] <= 5 and not visited[y, W-1]:
        visited[y, W-1] = True
        queue.append((y, W-1))

while queue:
    y, x = queue.popleft()
    for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        ny, nx = y + dy, x + dx
        if 0 <= ny < H and 0 <= nx < W and not visited[ny, nx]:
            # If neighboring pixel is very dark (<= 5), it is part of background
            if lum[ny, nx] <= 5:
                visited[ny, nx] = True
                queue.append((ny, nx))

# Now create an alpha mask
# Initial alpha: 255 where not visited, 0 where visited
alpha = np.where(visited, 0, 255).astype(np.uint8)

# Feather the edge slightly (1-2px) to prevent harsh stair-stepping
mask_img = Image.fromarray(alpha, mode="L")
# Apply slight blur to smooth edge transitions
smoothed_mask = mask_img.filter(ImageFilter.GaussianBlur(radius=0.7))
mask_arr = np.array(smoothed_mask)

# For pixels where original lum was <= 1, keep strictly 0 alpha
mask_arr[lum <= 1] = 0

arr[:, :, 3] = mask_arr

out_img = Image.fromarray(arr, mode="RGBA")
out_img.save(output_path, "PNG")
print("Saved cutout to:", output_path)
