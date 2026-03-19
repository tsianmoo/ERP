package com.productmanagement.service;

import com.productmanagement.dto.ImageCategoryDTO;
import java.util.List;

public interface ImageCategoryService {
    
    List<ImageCategoryDTO> getAllCategories();
    
    ImageCategoryDTO getCategoryById(Integer id);
    
    ImageCategoryDTO createCategory(ImageCategoryDTO request);
    
    ImageCategoryDTO updateCategory(Integer id, ImageCategoryDTO request);
    
    void deleteCategory(Integer id);
}
