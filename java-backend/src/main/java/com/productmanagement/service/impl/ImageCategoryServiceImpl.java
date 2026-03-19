package com.productmanagement.service.impl;

import com.productmanagement.dto.ImageCategoryDTO;
import com.productmanagement.entity.ImageCategory;
import com.productmanagement.repository.ImageCategoryRepository;
import com.productmanagement.service.ImageCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageCategoryServiceImpl implements ImageCategoryService {
    
    private final ImageCategoryRepository repository;
    
    @Override
    public List<ImageCategoryDTO> getAllCategories() {
        return repository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public ImageCategoryDTO getCategoryById(Integer id) {
        ImageCategory category = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("图片分类不存在: " + id));
        return toDTO(category);
    }
    
    @Override
    @Transactional
    public ImageCategoryDTO createCategory(ImageCategoryDTO request) {
        ImageCategory category = new ImageCategory();
        category.setName(request.getName());
        category.setType(request.getType());
        category.setAttributeCode(request.getAttributeCode());
        category.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        
        ImageCategory saved = repository.save(category);
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public ImageCategoryDTO updateCategory(Integer id, ImageCategoryDTO request) {
        ImageCategory category = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("图片分类不存在: " + id));
        
        if (request.getName() != null) category.setName(request.getName());
        if (request.getType() != null) category.setType(request.getType());
        if (request.getAttributeCode() != null) category.setAttributeCode(request.getAttributeCode());
        if (request.getSortOrder() != null) category.setSortOrder(request.getSortOrder());
        
        ImageCategory saved = repository.save(category);
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public void deleteCategory(Integer id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("图片分类不存在: " + id);
        }
        repository.deleteById(id);
    }
    
    private ImageCategoryDTO toDTO(ImageCategory category) {
        ImageCategoryDTO dto = new ImageCategoryDTO();
        dto.setId(category.getId());
        dto.setName(category.getName());
        dto.setType(category.getType());
        dto.setAttributeCode(category.getAttributeCode());
        dto.setSortOrder(category.getSortOrder());
        dto.setCreatedAt(category.getCreatedAt());
        dto.setUpdatedAt(category.getUpdatedAt());
        return dto;
    }
}
