package com.productmanagement.service;

import com.productmanagement.dto.ImageDTO;

import java.util.List;

public interface ImageService {
    
    List<ImageDTO> getAllImages();
    
    List<ImageDTO> getImagesByCategory(Integer categoryId);
    
    ImageDTO getImageById(Integer id);
    
    ImageDTO createImage(ImageDTO request);
    
    ImageDTO updateImage(Integer id, ImageDTO request);
    
    void deleteImage(Integer id);
}
