package com.productmanagement.service.impl;

import com.productmanagement.dto.ColorValueDTO;
import com.productmanagement.entity.ColorValue;
import com.productmanagement.repository.ColorValueRepository;
import com.productmanagement.service.ColorValueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ColorValueServiceImpl implements ColorValueService {
    
    private final ColorValueRepository repository;
    
    @Override
    public List<ColorValueDTO> getAllValues() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<ColorValueDTO> getValuesByGroupId(Integer groupId) {
        return repository.findByGroupIdOrderBySortOrderAsc(groupId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public ColorValueDTO getValueById(Integer id) {
        ColorValue value = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("颜色值不存在: " + id));
        return toDTO(value);
    }
    
    @Override
    @Transactional
    public ColorValueDTO createValue(ColorValueDTO request) {
        ColorValue value = new ColorValue();
        value.setGroupId(request.getGroupId());
        value.setName(request.getName());
        value.setCode(request.getCode());
        value.setTransparency(request.getTransparency() != null ? request.getTransparency() : 10);
        value.setHexCode(request.getHexCode());
        value.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        
        ColorValue saved = repository.save(value);
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public ColorValueDTO updateValue(Integer id, ColorValueDTO request) {
        ColorValue value = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("颜色值不存在: " + id));
        
        if (request.getName() != null) value.setName(request.getName());
        if (request.getCode() != null) value.setCode(request.getCode());
        if (request.getTransparency() != null) value.setTransparency(request.getTransparency());
        if (request.getHexCode() != null) value.setHexCode(request.getHexCode());
        if (request.getSortOrder() != null) value.setSortOrder(request.getSortOrder());
        
        ColorValue saved = repository.save(value);
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public void deleteValue(Integer id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("颜色值不存在: " + id);
        }
        repository.deleteById(id);
    }
    
    @Override
    @Transactional
    public void deleteValuesByGroupId(Integer groupId) {
        repository.deleteByGroupId(groupId);
    }
    
    private ColorValueDTO toDTO(ColorValue value) {
        ColorValueDTO dto = new ColorValueDTO();
        dto.setId(value.getId());
        dto.setGroupId(value.getGroupId());
        dto.setName(value.getName());
        dto.setCode(value.getCode());
        dto.setTransparency(value.getTransparency());
        dto.setHexCode(value.getHexCode());
        dto.setSortOrder(value.getSortOrder());
        dto.setCreatedAt(value.getCreatedAt());
        dto.setUpdatedAt(value.getUpdatedAt());
        return dto;
    }
}
