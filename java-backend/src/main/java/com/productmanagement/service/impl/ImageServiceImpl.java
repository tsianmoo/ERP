package com.productmanagement.service.impl;

import com.productmanagement.dto.ImageDTO;
import com.productmanagement.entity.Image;
import com.productmanagement.repository.ImageRepository;
import com.productmanagement.service.ImageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageServiceImpl implements ImageService {
    
    private final ImageRepository repository;
    
    @Override
    public List<ImageDTO> getAllImages() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<ImageDTO> getImagesByCategory(Integer categoryId) {
        return repository.findByCategoryIdOrderByCreatedAtDesc(categoryId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public ImageDTO getImageById(Integer id) {
        Image image = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("图片不存在: " + id));
        return toDTO(image);
    }
    
    @Override
    @Transactional
    public ImageDTO createImage(ImageDTO request) {
        Image image = new Image();
        image.setName(request.getName());
        image.setUrl(request.getUrl());
        image.setCategoryId(request.getCategoryId());
        image.setFileSize(request.getFileSize());
        image.setWidth(request.getWidth());
        image.setHeight(request.getHeight());
        
        Image saved = repository.save(image);
        log.info("创建图片成功，ID: {}", saved.getId());
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public ImageDTO updateImage(Integer id, ImageDTO request) {
        Image image = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("图片不存在: " + id));
        
        if (request.getName() != null) image.setName(request.getName());
        if (request.getUrl() != null) image.setUrl(request.getUrl());
        if (request.getCategoryId() != null) image.setCategoryId(request.getCategoryId());
        if (request.getFileSize() != null) image.setFileSize(request.getFileSize());
        if (request.getWidth() != null) image.setWidth(request.getWidth());
        if (request.getHeight() != null) image.setHeight(request.getHeight());
        
        Image updated = repository.save(image);
        log.info("更新图片成功，ID: {}", updated.getId());
        return toDTO(updated);
    }
    
    @Override
    @Transactional
    public void deleteImage(Integer id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("图片不存在: " + id);
        }
        repository.deleteById(id);
        log.info("删除图片成功，ID: {}", id);
    }
    
    private ImageDTO toDTO(Image image) {
        ImageDTO.ImageCategoryDTO categoryDTO = null;
        if (image.getCategory() != null) {
            categoryDTO = ImageDTO.ImageCategoryDTO.builder()
                    .id(image.getCategory().getId())
                    .name(image.getCategory().getName())
                    .type(image.getCategory().getType())
                    .attributeCode(image.getCategory().getAttributeCode())
                    .sortOrder(image.getCategory().getSortOrder())
                    .build();
        }
        
        return ImageDTO.builder()
                .id(image.getId())
                .name(image.getName())
                .url(image.getUrl())
                .categoryId(image.getCategoryId())
                .fileSize(image.getFileSize())
                .width(image.getWidth())
                .height(image.getHeight())
                .category(categoryDTO)
                .createdAt(image.getCreatedAt())
                .updatedAt(image.getUpdatedAt())
                .build();
    }
}
