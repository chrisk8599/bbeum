import cloudinary
import cloudinary.uploader
from lib.config import settings

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True
)

def upload_image(file_bytes, folder="services"):
    """
    Upload image to Cloudinary
    
    Args:
        file_bytes: Image file bytes
        folder: Cloudinary folder name (default: "services")
    
    Returns:
        dict: Cloudinary response with 'secure_url', 'public_id', etc.
    """
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder=folder,
            resource_type="image",
            transformation=[
                {'width': 1200, 'height': 1200, 'crop': 'limit'},  # Max size
                {'quality': 'auto'},  # Auto quality optimization
                {'fetch_format': 'auto'}  # Auto format (WebP when supported)
            ]
        )
        return result
    except Exception as e:
        raise Exception(f"Failed to upload image: {str(e)}")

def delete_image(public_id):
    """
    Delete image from Cloudinary
    
    Args:
        public_id: Cloudinary public ID of the image
    
    Returns:
        dict: Cloudinary response
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result
    except Exception as e:
        raise Exception(f"Failed to delete image: {str(e)}")
