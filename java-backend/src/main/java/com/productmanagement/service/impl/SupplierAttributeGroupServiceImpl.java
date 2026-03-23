package com.productmanagement.service.impl;

import com.productmanagement.dto.SupplierAttributeGroupDTO;
import com.productmanagement.entity.SupplierAttributeGroup;
import com.productmanagement.repository.SupplierAttributeGroupRepository;
import com.productmanagement.service.SupplierAttributeGroupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupplierAttributeGroupServiceImpl implements SupplierAttributeGroupService {
    
    private final SupplierAttributeGroupRepository groupRepository;
    
    @Override
    public List<SupplierAttributeGroupDTO> getAllGroups() {
        return groupRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public SupplierAttributeGroupDTO getGroupById(Integer id) {
        SupplierAttributeGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("分组不存在: " + id));
        return toDTO(group);
    }
    
    @Override
    @Transactional
    public SupplierAttributeGroupDTO createGroup(SupplierAttributeGroupDTO request) {
        SupplierAttributeGroup group = new SupplierAttributeGroup();
        group.setName(request.getName());
        group.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        
        SupplierAttributeGroup savedGroup = groupRepository.save(group);
        log.info("创建供应商属性分组成功，ID: {}", savedGroup.getId());
        return toDTO(savedGroup);
    }
    
    @Override
    @Transactional
    public SupplierAttributeGroupDTO updateGroup(Integer id, SupplierAttributeGroupDTO request) {
        SupplierAttributeGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("分组不存在: " + id));
        
        if (request.getName() != null) {
            group.setName(request.getName());
        }
        if (request.getSortOrder() != null) {
            group.setSortOrder(request.getSortOrder());
        }
        
        SupplierAttributeGroup updatedGroup = groupRepository.save(group);
        log.info("更新供应商属性分组成功，ID: {}", updatedGroup.getId());
        return toDTO(updatedGroup);
    }
    
    @Override
    @Transactional
    public void deleteGroup(Integer id) {
        if (!groupRepository.existsById(id)) {
            throw new RuntimeException("分组不存在: " + id);
        }
        groupRepository.deleteById(id);
        log.info("删除供应商属性分组成功，ID: {}", id);
    }
    
    private SupplierAttributeGroupDTO toDTO(SupplierAttributeGroup group) {
        return SupplierAttributeGroupDTO.builder()
                .id(group.getId())
                .name(group.getName())
                .sortOrder(group.getSortOrder())
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }
}
