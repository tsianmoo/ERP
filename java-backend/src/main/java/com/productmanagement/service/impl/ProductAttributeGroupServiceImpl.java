package com.productmanagement.service.impl;

import com.productmanagement.dto.ProductAttributeGroupDTO;
import com.productmanagement.entity.ProductAttributeGroup;
import com.productmanagement.repository.ProductAttributeGroupRepository;
import com.productmanagement.service.ProductAttributeGroupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductAttributeGroupServiceImpl implements ProductAttributeGroupService {
    
    private final ProductAttributeGroupRepository groupRepository;
    
    @Override
    public List<ProductAttributeGroupDTO> getAllGroups() {
        List<ProductAttributeGroup> groups = groupRepository.findAllByOrderBySortOrderAsc();
        return groups.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public ProductAttributeGroupDTO getGroupById(Integer id) {
        ProductAttributeGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("分组不存在: " + id));
        return toDTO(group);
    }
    
    @Override
    @Transactional
    public ProductAttributeGroupDTO createGroup(ProductAttributeGroupDTO request) {
        ProductAttributeGroup group = new ProductAttributeGroup();
        group.setName(request.getName());
        group.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        
        ProductAttributeGroup savedGroup = groupRepository.save(group);
        log.info("创建分组成功，ID: {}", savedGroup.getId());
        return toDTO(savedGroup);
    }
    
    @Override
    @Transactional
    public ProductAttributeGroupDTO updateGroup(Integer id, ProductAttributeGroupDTO request) {
        ProductAttributeGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("分组不存在: " + id));
        
        if (request.getName() != null) {
            group.setName(request.getName());
        }
        if (request.getSortOrder() != null) {
            group.setSortOrder(request.getSortOrder());
        }
        
        ProductAttributeGroup updatedGroup = groupRepository.save(group);
        log.info("更新分组成功，ID: {}", updatedGroup.getId());
        return toDTO(updatedGroup);
    }
    
    @Override
    @Transactional
    public void deleteGroup(Integer id) {
        if (!groupRepository.existsById(id)) {
            throw new RuntimeException("分组不存在: " + id);
        }
        groupRepository.deleteById(id);
        log.info("删除分组成功，ID: {}", id);
    }
    
    private ProductAttributeGroupDTO toDTO(ProductAttributeGroup group) {
        return ProductAttributeGroupDTO.builder()
                .id(group.getId())
                .name(group.getName())
                .sortOrder(group.getSortOrder())
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }
}
