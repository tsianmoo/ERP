package com.productmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {
    
    private List<T> data;
    private long total;
    private int page;
    private int pageSize;
    
    public static <T> PageResponse<T> of(List<T> data, long total, int page, int pageSize) {
        return PageResponse.<T>builder()
                .data(data)
                .total(total)
                .page(page)
                .pageSize(pageSize)
                .build();
    }
}
