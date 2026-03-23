package com.productmanagement.service.impl;

import com.productmanagement.dto.SupplierFieldGroupDTO;
import com.productmanagement.entity.SupplierFieldGroup;
import com.productmanagement.repository.SupplierFieldGroupRepository;
import com.productmanagement.service.SupplierFieldGroupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupplierFieldGroupServiceImpl implements SupplierFieldGroupService {
    
    private final SupplierFieldGroupRepository groupRepository;
    
    @Override
    public List<SupplierFieldGroupDTO> getAllGroups() {
        return groupRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public SupplierFieldGroupDTO getGroupById(Integer id) {
        SupplierFieldGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("分组不存在: " + id));
        return toDTO(group);
    }
    
    @Override
    @Transactional
    public SupplierFieldGroupDTO createGroup(SupplierFieldGroupDTO request) {
        SupplierFieldGroup group = new SupplierFieldGroup();
        group.setName(request.getName());
        group.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        
        SupplierFieldGroup savedGroup = groupRepository.save(group);
        log.info("创建供应商字段分组成功，ID: {}", savedGroup.getId());
        return toDTO(savedGroup);
    }
    
    @Override
    @Transactional
    public SupplierFieldGroupDTO updateGroup(Integer id, SupplierFieldGroupDTO request) {
        SupplierFieldGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("分组不存在: " + id));
        
        if (request.getName() != null) {
            group.setName(request.getName());
        }
        if (request.getSortOrder() != null) {
            group.setSortOrder(request.getSortOrder());
        }
        
        SupplierFieldGroup updatedGroup = groupRepository.save(group);
        log.info("更新供应商字段分组成功，ID: {}", updatedGroup.getId());
        return toDTO(updatedGroup);
    }
    
    @Override
    @Transactional
    public void deleteGroup(Integer id) {
        if (!groupRepository.existsById(id)) {
            throw new RuntimeException("分组不存在: " + id);
        }
        groupRepository.deleteById(id);
        log.info("删除供应商字段分组成功，ID: {}", id);
    }
    
    private SupplierFieldGroupDTO toDTO(SupplierFieldGroup group) {
        return SupplierFieldGroupDTO.builder()
                .id(group.getId())
                .name(group.getName())
                .sortOrder(group.getSortOrder())
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }
}
