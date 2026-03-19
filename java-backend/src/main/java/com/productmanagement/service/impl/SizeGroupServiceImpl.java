package com.productmanagement.service.impl;

import com.productmanagement.dto.SizeGroupDTO;
import com.productmanagement.entity.SizeGroup;
import com.productmanagement.entity.SizeValue;
import com.productmanagement.repository.SizeGroupRepository;
import com.productmanagement.service.SizeGroupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SizeGroupServiceImpl implements SizeGroupService {
    
    private final SizeGroupRepository groupRepository;
    
    @Override
    public List<SizeGroupDTO> getAllGroups() {
        return groupRepository.findAllWithValuesOrderBySortOrder().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public SizeGroupDTO getGroupById(Integer id) {
        SizeGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("尺码分组不存在: " + id));
        return toDTO(group);
    }
    
    @Override
    @Transactional
    public SizeGroupDTO createGroup(SizeGroupDTO request) {
        SizeGroup group = new SizeGroup();
        group.setName(request.getName());
        group.setCode(request.getCode());
        group.setCodeLength(request.getCodeLength());
        group.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        
        SizeGroup saved = groupRepository.save(group);
        log.info("创建尺码分组成功，ID: {}", saved.getId());
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public SizeGroupDTO updateGroup(Integer id, SizeGroupDTO request) {
        SizeGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("尺码分组不存在: " + id));
        
        if (request.getName() != null) group.setName(request.getName());
        if (request.getCode() != null) group.setCode(request.getCode());
        if (request.getCodeLength() != null) group.setCodeLength(request.getCodeLength());
        if (request.getSortOrder() != null) group.setSortOrder(request.getSortOrder());
        
        SizeGroup updated = groupRepository.save(group);
        log.info("更新尺码分组成功，ID: {}", updated.getId());
        return toDTO(updated);
    }
    
    @Override
    @Transactional
    public void deleteGroup(Integer id) {
        if (!groupRepository.existsById(id)) {
            throw new RuntimeException("尺码分组不存在: " + id);
        }
        groupRepository.deleteById(id);
        log.info("删除尺码分组成功，ID: {}", id);
    }
    
    @Override
    @Transactional
    public void reorderGroups(List<Integer> groupIds) {
        for (int i = 0; i < groupIds.size(); i++) {
            Integer groupId = groupIds.get(i);
            SizeGroup group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("尺码分组不存在: " + groupId));
            group.setSortOrder(i);
            groupRepository.save(group);
        }
        log.info("尺码分组排序更新成功");
    }
    
    private SizeGroupDTO toDTO(SizeGroup group) {
        List<SizeGroupDTO.SizeValueDTO> values = null;
        if (group.getSizeValues() != null) {
            values = group.getSizeValues().stream()
                    .map(this::toValueDTO)
                    .collect(Collectors.toList());
        }
        
        return SizeGroupDTO.builder()
                .id(group.getId())
                .name(group.getName())
                .code(group.getCode())
                .codeLength(group.getCodeLength())
                .sortOrder(group.getSortOrder())
                .sizeValues(values)
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }
    
    private SizeGroupDTO.SizeValueDTO toValueDTO(SizeValue value) {
        return SizeGroupDTO.SizeValueDTO.builder()
                .id(value.getId())
                .groupId(value.getGroupId())
                .name(value.getName())
                .code(value.getCode())
                .sortOrder(value.getSortOrder())
                .build();
    }
}
