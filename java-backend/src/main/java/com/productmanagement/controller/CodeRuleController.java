package com.productmanagement.controller;

import com.productmanagement.dto.CodeRuleDTO;
import com.productmanagement.service.CodeRuleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Tag(name = "编码规则管理", description = "商品编码规则相关接口")
@RestController
@RequestMapping("/api/products/code-rules")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CodeRuleController {
    
    private final CodeRuleService service;
    
    @Operation(summary = "获取所有编码规则")
    @GetMapping
    public ResponseEntity<?> getAllRules() {
        try {
            List<CodeRuleDTO> rules = service.getAllRules();
            return ResponseEntity.ok(Map.of("data", rules));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取编码规则详情")
    @GetMapping("/{id}")
    public ResponseEntity<?> getRuleById(@PathVariable Long id) {
        try {
            CodeRuleDTO rule = service.getRuleById(id);
            return ResponseEntity.ok(Map.of("data", rule));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "创建编码规则")
    @PostMapping
    public ResponseEntity<?> createRule(@RequestBody CodeRuleDTO request) {
        try {
            CodeRuleDTO rule = service.createRule(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", rule));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "更新编码规则")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateRule(@PathVariable Long id, @RequestBody CodeRuleDTO request) {
        try {
            CodeRuleDTO rule = service.updateRule(id, request);
            return ResponseEntity.ok(Map.of("data", rule));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "删除编码规则")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRule(@PathVariable Long id) {
        try {
            service.deleteRule(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
    
    @Operation(summary = "获取可用变量列表", description = "获取编码规则可用的变量列表")
    @GetMapping("/variables")
    public ResponseEntity<?> getVariables() {
        try {
            Map<String, Object> result = new HashMap<>();
            
            // 内置变量
            List<Map<String, String>> builtIn = new ArrayList<>();
            builtIn.add(createVariable("year", "年份", "当前年份，如2024"));
            builtIn.add(createVariable("month", "月份", "当前月份，如01-12"));
            builtIn.add(createVariable("day", "日期", "当前日期，如01-31"));
            builtIn.add(createVariable("sequence", "流水号", "自动递增的流水号"));
            builtIn.add(createVariable("base_code", "基础货号", "商品基础货号"));
            builtIn.add(createVariable("color_code", "颜色编码", "商品颜色编码"));
            builtIn.add(createVariable("color_group_code", "颜色组编码", "商品颜色组编码"));
            builtIn.add(createVariable("size_code", "尺码编码", "商品尺码编码"));
            builtIn.add(createVariable("size_group_code", "尺码组编码", "商品尺码组编码"));
            
            // 基本字段变量（从服务获取）
            List<Map<String, String>> basicFields = service.getBasicFieldVariables();
            
            // 属性变量（从服务获取）
            List<Map<String, String>> attributes = service.getAttributeVariables();
            
            result.put("builtIn", builtIn);
            result.put("basicFields", basicFields);
            result.put("attributes", attributes);
            
            return ResponseEntity.ok(Map.of("data", result));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    private Map<String, String> createVariable(String value, String label, String description) {
        Map<String, String> variable = new HashMap<>();
        variable.put("value", value);
        variable.put("label", label);
        variable.put("description", description);
        return variable;
    }
}
