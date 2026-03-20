package com.productmanagement.service.impl;

import com.productmanagement.dto.ProductBasicFieldDTO;
import com.productmanagement.entity.ProductBasicField;
import com.productmanagement.entity.ProductFieldGroup;
import com.productmanagement.repository.ProductBasicFieldRepository;
import com.productmanagement.service.ProductBasicFieldService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductBasicFieldServiceImpl implements ProductBasicFieldService {
    
    private final ProductBasicFieldRepository fieldRepository;
    
    // 常用词汇映射（中文到英文拼音）
    private static final Map<String, String> COMMON_CHINESE_MAP = new HashMap<>();
    
    static {
        COMMON_CHINESE_MAP.put("货号", "product_code");
        COMMON_CHINESE_MAP.put("商品名称", "product_name");
        COMMON_CHINESE_MAP.put("商品", "product");
        COMMON_CHINESE_MAP.put("名称", "name");
        COMMON_CHINESE_MAP.put("品牌", "brand");
        COMMON_CHINESE_MAP.put("供应商", "supplier");
        COMMON_CHINESE_MAP.put("颜色", "color");
        COMMON_CHINESE_MAP.put("尺码", "size");
        COMMON_CHINESE_MAP.put("规格", "specification");
        COMMON_CHINESE_MAP.put("价格", "price");
        COMMON_CHINESE_MAP.put("单价", "unit_price");
        COMMON_CHINESE_MAP.put("数量", "quantity");
        COMMON_CHINESE_MAP.put("库存", "stock");
        COMMON_CHINESE_MAP.put("重量", "weight");
        COMMON_CHINESE_MAP.put("长度", "length");
        COMMON_CHINESE_MAP.put("宽度", "width");
        COMMON_CHINESE_MAP.put("高度", "height");
        COMMON_CHINESE_MAP.put("成本", "cost");
        COMMON_CHINESE_MAP.put("折扣", "discount");
        COMMON_CHINESE_MAP.put("分类", "category");
        COMMON_CHINESE_MAP.put("类型", "type");
        COMMON_CHINESE_MAP.put("状态", "status");
        COMMON_CHINESE_MAP.put("备注", "remark");
        COMMON_CHINESE_MAP.put("描述", "description");
        COMMON_CHINESE_MAP.put("图片", "image");
        COMMON_CHINESE_MAP.put("创建时间", "created_at");
        COMMON_CHINESE_MAP.put("更新时间", "updated_at");
        COMMON_CHINESE_MAP.put("生产厂家", "manufacturer");
        COMMON_CHINESE_MAP.put("产地", "origin");
        COMMON_CHINESE_MAP.put("材质", "material");
        COMMON_CHINESE_MAP.put("款式", "style");
        COMMON_CHINESE_MAP.put("系列", "series");
        COMMON_CHINESE_MAP.put("季节", "season");
        COMMON_CHINESE_MAP.put("年份", "year");
        COMMON_CHINESE_MAP.put("款号", "style_code");
        COMMON_CHINESE_MAP.put("条码", "barcode");
    }
    
    @Override
    public List<ProductBasicFieldDTO> getAllFields() {
        List<ProductBasicField> fields = fieldRepository.findAllWithGroupOrderBySortOrder();
        return fields.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public ProductBasicFieldDTO getFieldById(Integer id) {
        ProductBasicField field = fieldRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("字段不存在: " + id));
        return toDTO(field);
    }
    
    @Override
    @Transactional
    public ProductBasicFieldDTO createField(ProductBasicFieldDTO request) {
        // 如果没有提供 field_code，则自动生成
        String fieldCode = request.getFieldCode();
        if (fieldCode == null || fieldCode.isEmpty()) {
            fieldCode = generateFieldCode(request.getFieldName());
        }
        
        ProductBasicField field = new ProductBasicField();
        field.setFieldName(request.getFieldName());
        field.setDisplayName(request.getDisplayName() != null ? request.getDisplayName() : request.getFieldName());
        field.setFieldCode(fieldCode);
        field.setFieldType(request.getFieldType());
        field.setIsRequired(request.getIsRequired() != null ? request.getIsRequired() : false);
        field.setOptions(request.getOptions());
        field.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        field.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
        field.setGroupId(request.getGroupId());
        field.setAutoGenerate(request.getAutoGenerate());
        field.setCodeRuleId(request.getCodeRuleId());
        field.setWidth(request.getWidth());
        field.setColumns(request.getColumns());
        field.setColumnWidth(request.getColumnWidth());
        field.setSpacing(request.getSpacing());
        field.setRowIndex(request.getRowIndex());
        field.setNewRow(request.getNewRow());
        field.setGroupSortOrder(request.getGroupSortOrder());
        
        ProductBasicField savedField = fieldRepository.save(field);
        log.info("创建字段成功，ID: {}", savedField.getId());
        return toDTO(savedField);
    }
    
    @Override
    @Transactional
    public ProductBasicFieldDTO updateField(Integer id, ProductBasicFieldDTO request) {
        ProductBasicField field = fieldRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("字段不存在: " + id));
        
        if (request.getFieldName() != null) {
            field.setFieldName(request.getFieldName());
        }
        if (request.getDisplayName() != null) {
            field.setDisplayName(request.getDisplayName());
        }
        if (request.getFieldCode() != null) {
            field.setFieldCode(request.getFieldCode());
        }
        if (request.getFieldType() != null) {
            field.setFieldType(request.getFieldType());
        }
        if (request.getIsRequired() != null) {
            field.setIsRequired(request.getIsRequired());
        }
        if (request.getOptions() != null) {
            field.setOptions(request.getOptions());
        }
        if (request.getSortOrder() != null) {
            field.setSortOrder(request.getSortOrder());
        }
        if (request.getEnabled() != null) {
            field.setEnabled(request.getEnabled());
        }
        if (request.getGroupId() != null) {
            field.setGroupId(request.getGroupId());
        }
        if (request.getAutoGenerate() != null) {
            field.setAutoGenerate(request.getAutoGenerate());
        }
        if (request.getCodeRuleId() != null) {
            field.setCodeRuleId(request.getCodeRuleId());
        }
        if (request.getWidth() != null) {
            field.setWidth(request.getWidth());
        }
        if (request.getColumns() != null) {
            field.setColumns(request.getColumns());
        }
        if (request.getColumnWidth() != null) {
            field.setColumnWidth(request.getColumnWidth());
        }
        if (request.getSpacing() != null) {
            field.setSpacing(request.getSpacing());
        }
        if (request.getRowIndex() != null) {
            field.setRowIndex(request.getRowIndex());
        }
        if (request.getNewRow() != null) {
            field.setNewRow(request.getNewRow());
        }
        if (request.getGroupSortOrder() != null) {
            field.setGroupSortOrder(request.getGroupSortOrder());
        }
        
        ProductBasicField updatedField = fieldRepository.save(field);
        log.info("更新字段成功，ID: {}", updatedField.getId());
        return toDTO(updatedField);
    }
    
    @Override
    @Transactional
    public void deleteField(Integer id) {
        if (!fieldRepository.existsById(id)) {
            throw new RuntimeException("字段不存在: " + id);
        }
        fieldRepository.deleteById(id);
        log.info("删除字段成功，ID: {}", id);
    }
    
    private String generateFieldCode(String fieldName) {
        if (fieldName == null || fieldName.isEmpty()) {
            return "custom_field";
        }
        
        String result = fieldName.trim();
        
        // 检查是否在常用映射表中
        for (Map.Entry<String, String> entry : COMMON_CHINESE_MAP.entrySet()) {
            if (result.equals(entry.getKey())) {
                return entry.getValue();
            }
            // 处理包含常用词的情况
            result = result.replace(entry.getKey(), entry.getValue());
        }
        
        // 转换为小写
        result = result.toLowerCase();
        
        // 将空格和特殊字符替换为下划线
        result = result.replaceAll("[\\s\\-–—]+", "_");
        
        // 只保留小写字母、数字和下划线
        result = result.replaceAll("[^a-z0-9_]", "_");
        
        // 将连续的下划线替换为单个下划线
        result = result.replaceAll("_{2,}", "_");
        
        // 去除开头和结尾的下划线
        result = result.replaceAll("^_+|_+$", "");
        
        // 确保不以数字开头
        if (result.matches("^[0-9].*")) {
            result = "field_" + result;
        }
        
        // 如果结果为空，使用默认值
        if (result.isEmpty()) {
            result = "custom_field";
        }
        
        return result;
    }
    
    private ProductBasicFieldDTO toDTO(ProductBasicField field) {
        ProductBasicFieldDTO.FieldGroupDTO fieldGroupDTO = null;
        if (field.getFieldGroup() != null) {
            fieldGroupDTO = ProductBasicFieldDTO.FieldGroupDTO.builder()
                    .id(field.getFieldGroup().getId())
                    .name(field.getFieldGroup().getName())
                    .sortOrder(field.getFieldGroup().getSortOrder())
                    .build();
        }
        
        return ProductBasicFieldDTO.builder()
                .id(field.getId())
                .fieldName(field.getFieldName())
                .displayName(field.getDisplayName() != null ? field.getDisplayName() : field.getFieldName())
                .fieldCode(field.getFieldCode())
                .fieldType(field.getFieldType())
                .isRequired(field.getIsRequired())
                .options(field.getOptions())
                .sortOrder(field.getSortOrder())
                .enabled(field.getEnabled())
                .width(field.getWidth())
                .columns(field.getColumns())
                .columnWidth(field.getColumnWidth())
                .spacing(field.getSpacing())
                .rowIndex(field.getRowIndex())
                .newRow(field.getNewRow())
                .groupSortOrder(field.getGroupSortOrder())
                .groupName(field.getGroupName())
                .groupId(field.getGroupId())
                .autoGenerate(field.getAutoGenerate())
                .codeRuleId(field.getCodeRuleId())
                .fieldGroup(fieldGroupDTO)
                .createdAt(field.getCreatedAt())
                .updatedAt(field.getUpdatedAt())
                .build();
    }
}
