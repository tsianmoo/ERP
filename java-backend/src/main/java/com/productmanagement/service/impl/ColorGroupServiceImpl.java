package com.productmanagement.service.impl;

import com.productmanagement.dto.ColorGroupDTO;
import com.productmanagement.entity.ColorGroup;
import com.productmanagement.entity.ColorValue;
import com.productmanagement.repository.ColorGroupRepository;
import com.productmanagement.repository.ColorValueRepository;
import com.productmanagement.service.ColorGroupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ColorGroupServiceImpl implements ColorGroupService {
    
    private final ColorGroupRepository groupRepository;
    private final ColorValueRepository valueRepository;
    
    @Override
    public List<ColorGroupDTO> getAllGroups() {
        return groupRepository.findAllWithValuesOrderBySortOrder().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public ColorGroupDTO getGroupById(Integer id) {
        ColorGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("颜色分组不存在: " + id));
        return toDTO(group);
    }
    
    @Override
    @Transactional
    public ColorGroupDTO createGroup(ColorGroupDTO request) {
        ColorGroup group = new ColorGroup();
        group.setName(request.getName());
        group.setCode(request.getCode());
        group.setGroupCode(request.getGroupCode());
        group.setCodeLength(request.getCodeLength());
        group.setColor(request.getColor());
        group.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        
        ColorGroup saved = groupRepository.save(group);
        log.info("创建颜色分组成功，ID: {}", saved.getId());
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public ColorGroupDTO updateGroup(Integer id, ColorGroupDTO request) {
        ColorGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("颜色分组不存在: " + id));
        
        if (request.getName() != null) group.setName(request.getName());
        if (request.getCode() != null) group.setCode(request.getCode());
        if (request.getGroupCode() != null) group.setGroupCode(request.getGroupCode());
        if (request.getCodeLength() != null) group.setCodeLength(request.getCodeLength());
        if (request.getColor() != null) group.setColor(request.getColor());
        if (request.getSortOrder() != null) group.setSortOrder(request.getSortOrder());
        
        ColorGroup updated = groupRepository.save(group);
        log.info("更新颜色分组成功，ID: {}", updated.getId());
        return toDTO(updated);
    }
    
    @Override
    @Transactional
    public void deleteGroup(Integer id) {
        if (!groupRepository.existsById(id)) {
            throw new RuntimeException("颜色分组不存在: " + id);
        }
        groupRepository.deleteById(id);
        log.info("删除颜色分组成功，ID: {}", id);
    }
    
    @Override
    @Transactional
    public void reorderGroups(List<Integer> groupIds) {
        for (int i = 0; i < groupIds.size(); i++) {
            Integer groupId = groupIds.get(i);
            ColorGroup group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("颜色分组不存在: " + groupId));
            group.setSortOrder(i);
            groupRepository.save(group);
        }
        log.info("颜色分组排序更新成功");
    }
    
    private ColorGroupDTO toDTO(ColorGroup group) {
        List<ColorGroupDTO.ColorValueDTO> values = null;
        if (group.getColorValues() != null) {
            values = group.getColorValues().stream()
                    .map(this::toValueDTO)
                    .collect(Collectors.toList());
        }
        
        return ColorGroupDTO.builder()
                .id(group.getId())
                .name(group.getName())
                .code(group.getCode())
                .groupCode(group.getGroupCode())
                .codeLength(group.getCodeLength())
                .color(group.getColor())
                .sortOrder(group.getSortOrder())
                .colorValues(values)
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }
    
    private ColorGroupDTO.ColorValueDTO toValueDTO(ColorValue value) {
        return ColorGroupDTO.ColorValueDTO.builder()
                .id(value.getId())
                .groupId(value.getGroupId())
                .name(value.getName())
                .code(value.getCode())
                .hexCode(value.getHexCode())
                .transparency(value.getTransparency())
                .sortOrder(value.getSortOrder())
                .build();
    }
}
